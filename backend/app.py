"""
Flask Application for AI Skin Care Expert System with Dynamic Skin Digital Twin.
Exposes REST API endpoints for:
- Authentication & User Isolation
- Traditional Computer Vision Frame Analysis (No Machine Learning)
- Structured Assessments (Separating Image Observations, User Questionnaire, and Rule Conclusions)
- Dynamic Skin Digital Twin (Three segregated non-merged data categories)
- Symbolic Explainable AI Reasoning Graph & Rules
- Personalized Soothing Skincare Routines (Morning & Evening with task tracking)
- Duration-based Routine & Recovery Timeline (7, 14, 28 days adherence & ratings)
- Food & Hydration Planner (Indian food preferences, balanced habits)
- Daily Reminders & Notification Settings
- Privacy & User Data Purge Controls
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import secrets
from datetime import datetime, timezone, timedelta
import json
import os
from functools import wraps
from typing import Dict, Any, List, Optional

from database import (
    init_db, get_db_connection, hash_password, verify_password, get_user_by_token,
    get_user_routine_plan, save_or_update_routine_plan, log_routine_task_action,
    get_user_routine_tasks, reset_user_routine_tasks, toggle_routine_task_action,
    record_symptom_checkin, get_user_symptom_history,
    record_food_diary_entry, get_user_food_diary, record_hydration_log,
    get_user_hydration_logs, get_user_reminders, create_or_update_reminder,
    delete_user_reminder, delete_all_user_data,
    create_password_reset, verify_password_reset_code, reset_user_password,
    is_smtp_configured, send_password_reset_email, delete_user_assessment, get_user_profile_stats
)
from ai_engine.inference_engine import InferenceEngine
from ai_engine.explanation_engine import ExplanationEngine
from ai_engine.digital_twin import SkinDigitalTwin
from ai_engine.simulator import WhatIfSimulator
from ai_engine.knowledge_base import build_knowledge_base
from ai_engine.cv_processor import TraditionalCVProcessor

app = Flask(__name__)

# Configure production-ready CORS
cors_origins_raw = os.environ.get("CORS_ORIGINS", "*").strip()
if cors_origins_raw == "*" or not cors_origins_raw:
    CORS(app, resources={r"/*": {"origins": "*"}})
else:
    allowed_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)


@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for production uptime monitoring and deployment verification."""
    return jsonify({
        "status": "healthy",
        "service": "AI Skin Care Expert System API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200

# Initialize Database, Rules, and CV Processor
init_db()
inference_engine = InferenceEngine()
simulator = WhatIfSimulator(inference_engine)
all_rules = build_knowledge_base()
cv_processor = TraditionalCVProcessor()


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        user = get_user_by_token(token)
        if not user:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function


# ==================== AUTHENTICATION ====================

import re

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip().lower()
    full_name = data.get("full_name", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    # Validations
    if not full_name:
        return jsonify({"error": "Full name is required."}), 400
    if not username:
        return jsonify({"error": "Username is required."}), 400
    if not USERNAME_REGEX.match(username):
        return jsonify({"error": "Username must be 3-30 characters and contain only letters, numbers, or underscores."}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Please provide a valid email address."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for unique email
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "An account with this email address already exists."}), 409

    # Check for unique username
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "This username is already taken. Please choose another username."}), 409

    pwd_hash = hash_password(password)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO users (email, username, full_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (email, username, full_name, pwd_hash, now)
    )
    user_id = cursor.lastrowid

    token = secrets.token_hex(32)
    cursor.execute(
        "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Registration successful.",
        "token": token,
        "user": {"id": user_id, "email": email, "username": username, "full_name": full_name}
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = (data.get("username_or_email") or data.get("email") or data.get("username") or "").strip().lower()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, username, full_name, password_hash
        FROM users
        WHERE email = ? OR username = ?
    """, (identifier, identifier))
    user_row = cursor.fetchone()

    if not user_row or not verify_password(user_row["password_hash"], password):
        conn.close()
        return jsonify({"error": "Invalid username/email or password."}), 401

    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_row["id"], now)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user_row["id"],
            "email": user_row["email"],
            "username": user_row["username"] or user_row["email"].split("@")[0],
            "full_name": user_row["full_name"]
        }
    }), 200


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if token:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"message": "Logged out successfully."}), 200


@app.route("/api/auth/me", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({"user": request.current_user}), 200


# ==================== FORGOT PASSWORD FLOW ====================

@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Please enter a valid email address."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()

    # Generate 6-digit secure code
    reset_code = f"{secrets.randbelow(900000) + 100000}"

    if user_row:
        # Store verification code in DB with 10-minute expiry
        create_password_reset(email, user_row["id"], reset_code, expires_in_minutes=10)
    conn.close()

    # Check if SMTP is configured on the backend
    if not is_smtp_configured():
        return jsonify({
            "success": False,
            "smtp_configured": False,
            "message": "Email delivery service is not configured on this server. To enable password recovery emails, configure the SMTP environment variables (SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL)."
        }), 200

    # If configured and user exists, send email
    if user_row:
        send_ok, send_msg = send_password_reset_email(email, reset_code)
        if not send_ok:
            return jsonify({
                "success": False,
                "smtp_configured": True,
                "message": f"Could not deliver email: {send_msg}"
            }), 500

    # Do not reveal whether email is registered to prevent user enumeration
    return jsonify({
        "success": True,
        "smtp_configured": True,
        "message": "If this email is registered in our system, a 6-digit verification code has been sent. Please check your inbox and spam folder."
    }), 200


@app.route("/api/auth/verify-reset-code", methods=["POST"])
def verify_reset_code_endpoint():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    code = data.get("reset_code", "").strip()

    if not email or not code:
        return jsonify({"error": "Email address and 6-digit code are required."}), 400

    is_valid, msg = verify_password_reset_code(email, code)
    if not is_valid:
        return jsonify({"error": msg}), 400

    return jsonify({"valid": True, "message": msg}), 200


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password_endpoint():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    code = data.get("reset_code", "").strip()
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not email or not code:
        return jsonify({"error": "Email address and code are required."}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400
    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    success, msg = reset_user_password(email, code, new_password)
    if not success:
        return jsonify({"error": msg}), 400

    return jsonify({"message": msg}), 200


# ==================== TRADITIONAL COMPUTER VISION ====================

@app.route("/api/cv/analyze-frame", methods=["POST"])
def analyze_cv_frame():
    """Endpoint for traditional OpenCV processing of webcam frames."""
    data = request.get_json() or {}
    image_base64 = data.get("image", "")
    if not image_base64:
        return jsonify({"success": False, "validation_error": "No image data provided in payload."}), 400

    analysis = cv_processor.analyze_frame_base64(image_base64)
    return jsonify(analysis), 200


# ==================== DASHBOARD ====================

@app.route("/api/dashboard", methods=["GET"])
@login_required
def get_dashboard():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM assessments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 2
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    latest = dict(rows[0]) if rows else None
    previous = dict(rows[1]) if len(rows) > 1 else None

    if latest:
        inf_result = json.loads(latest["inference_result_json"]) if latest.get("inference_result_json") else {}
        twin_snapshot = SkinDigitalTwin.build_twin_snapshot(latest, inf_result, previous)
    else:
        twin_snapshot = None

    # Current routine & completion percentage
    active_plan = get_user_routine_plan(user_id)
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_tasks = get_user_routine_tasks(user_id, today_str)

    total_steps = 0
    completed_steps = 0
    if active_plan and "plan_json" in active_plan:
        pj = active_plan["plan_json"]
        total_steps = len(pj.get("morning", [])) + len(pj.get("evening", []))
        completed_steps = len([t for t in today_tasks if t.get("status") == "completed"])

    completion_pct = int((completed_steps / total_steps) * 100) if total_steps > 0 else 0

    # Next scheduled reminder
    reminders = get_user_reminders(user_id)
    enabled_reminders = [r for r in reminders if r.get("is_enabled")]
    next_reminder = enabled_reminders[0] if enabled_reminders else None

    # Recent symptom trend
    symptom_history = get_user_symptom_history(user_id, 7)

    return jsonify({
        "user": request.current_user,
        "has_assessments": latest is not None,
        "last_assessment_date": latest.get("created_at") if latest else None,
        "latest_assessment": latest,
        "digital_twin": twin_snapshot,
        "operating_mode": latest.get("operating_mode", "NORMAL") if latest else "NORMAL",
        "routine": {
            "has_routine": active_plan is not None,
            "mode": active_plan.get("mode", "NORMAL") if active_plan else "NORMAL",
            "today_completion_pct": completion_pct,
            "completed_steps": completed_steps,
            "total_steps": total_steps
        },
        "next_reminder": next_reminder,
        "symptom_trend": symptom_history
    }), 200


# ==================== ASSESSMENTS & INTAKE ====================

@app.route("/api/assessments", methods=["POST"])
@login_required
def create_assessment():
    user_id = request.current_user["id"]
    data = request.get_json() or {}

    # Separate inputs into Optical Observations vs User Questionnaire
    image_observations = data.get("image_observations") or {}
    user_questionnaire = data.get("user_questionnaire") or {}

    # Merge facts for symbolic forward-chaining reasoning engine
    facts = {}
    metrics = ["hydration", "oiliness", "sensitivity", "redness", "acne_concern", "dryness", "irritation", "barrier_concern"]
    for m in metrics:
        if m in data:
            facts[m] = float(data[m])
        elif m in user_questionnaire:
            try:
                facts[m] = float(user_questionnaire[m])
            except (ValueError, TypeError):
                pass
        if m in facts and (facts[m] < 0.0 or facts[m] > 100.0):
            return jsonify({"error": f"Metric {m} must be between 0.0 and 100.0."}), 400

    # Environmental & Lifestyle facts
    facts["temperature"] = float(data.get("temperature", user_questionnaire.get("temperature", 24)))
    facts["humidity"] = float(data.get("humidity", user_questionnaire.get("humidity", 50)))
    facts["uv_index"] = float(data.get("uv_index", user_questionnaire.get("uv_index", 3)))
    facts["sleep_hours"] = float(data.get("sleep_hours", user_questionnaire.get("sleep_hours", 7.5)))
    facts["outdoor_hours"] = float(data.get("outdoor_hours", user_questionnaire.get("outdoor_hours", 2.0)))
    facts["newly_introduced_products"] = bool(data.get("newly_introduced_products", user_questionnaire.get("new_products") not in [None, "", "None", "None reported"]))

    # Pass symptoms & questionnaire fields to working memory for rules S01-S06
    facts["symptoms"] = data.get("symptoms") or user_questionnaire.get("symptoms") or {}
    facts["dryness_tightness"] = user_questionnaire.get("dryness_tightness", "none")
    facts["user_sensitivity"] = user_questionnaire.get("sensitivity", "low")
    facts["user_redness"] = user_questionnaire.get("user_redness", "none")
    facts["burning_stinging"] = bool(user_questionnaire.get("burning_stinging", False) or facts["symptoms"].get("burning", False))
    facts["current_irritation"] = user_questionnaire.get("current_irritation", "none")

    # 1. Run Symbolic Inference Engine
    inference_result = inference_engine.run(facts)

    # 2. Retrieve previous assessment for delta calculation
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    """, (user_id,))
    prev_row = cursor.fetchone()
    previous_assessment = dict(prev_row) if prev_row else None

    # 3. Build Digital Twin state with 3 clean categories
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    assessment_payload = {
        "created_at": now_str,
        "image_observations": image_observations,
        "user_questionnaire": user_questionnaire
    }
    digital_twin = SkinDigitalTwin.build_twin_snapshot(assessment_payload, inference_result, previous_assessment)

    # 4. Insert into database
    cursor.execute("""
        INSERT INTO assessments (
            user_id, hydration, oiliness, sensitivity, redness, acne_concern, dryness, irritation,
            barrier_concern, temperature, humidity, uv_index, sleep_hours, outdoor_hours,
            newly_introduced_products, symptoms_json, barrier_health_index, operating_mode,
            primary_skin_state, completeness_score, inference_result_json, image_observations_json,
            user_questionnaire_json, rule_conclusions_json, confirmed_by_user, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (
        user_id,
        inference_result["initial_facts"]["hydration"],
        inference_result["initial_facts"]["oiliness"],
        inference_result["initial_facts"]["sensitivity"],
        inference_result["initial_facts"]["redness"],
        inference_result["initial_facts"]["acne_concern"],
        inference_result["initial_facts"]["dryness"],
        inference_result["initial_facts"]["irritation"],
        inference_result["initial_facts"]["barrier_concern"],
        inference_result["initial_facts"]["temperature"],
        inference_result["initial_facts"]["humidity"],
        inference_result["initial_facts"]["uv_index"],
        inference_result["initial_facts"]["sleep_hours"],
        inference_result["initial_facts"]["outdoor_hours"],
        1 if facts["newly_introduced_products"] else 0,
        json.dumps(facts.get("symptoms", {})),
        inference_result["barrier_health_index"],
        inference_result["operating_mode"],
        inference_result["primary_skin_state"],
        digital_twin["completeness_score"],
        json.dumps(inference_result),
        json.dumps(image_observations),
        json.dumps(user_questionnaire),
        json.dumps(digital_twin["category_c_rule_conclusions"]),
        now_str
    ))
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # 5. Automatically synthesize personalized routine plan based on expert reasoning
    generate_and_save_routine_from_rules(user_id, inference_result, user_questionnaire, assessment_id)

    return jsonify({
        "assessment_id": assessment_id,
        "inference_result": inference_result,
        "digital_twin": digital_twin,
        "operating_mode": inference_result["operating_mode"],
        "message": "Skin assessment completed and Digital Twin synchronized."
    }), 201


@app.route("/api/assessments/history", methods=["GET"])
@login_required
def get_assessment_history():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    history = []
    for r in rows:
        d = dict(r)
        try:
            d["image_observations"] = json.loads(d["image_observations_json"]) if d.get("image_observations_json") else None
            d["user_questionnaire"] = json.loads(d["user_questionnaire_json"]) if d.get("user_questionnaire_json") else None
            d["rule_conclusions"] = json.loads(d["rule_conclusions_json"]) if d.get("rule_conclusions_json") else None
        except Exception:
            pass
        history.append(d)

    return jsonify({"history": history}), 200


@app.route("/api/assessments/<int:assessment_id>", methods=["DELETE"])
@login_required
def delete_assessment_endpoint(assessment_id):
    user_id = request.current_user["id"]
    success = delete_user_assessment(user_id, assessment_id)
    if not success:
        return jsonify({"error": "Assessment not found or unauthorized."}), 404
    return jsonify({"message": "Assessment deleted successfully.", "deleted_id": assessment_id}), 200


# ==================== DYNAMIC SKIN DIGITAL TWIN ====================

@app.route("/api/twin/current", methods=["GET"])
@login_required
def get_current_twin():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 2
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({"has_twin": False, "message": "No skin assessment recorded yet."}), 200

    latest = dict(rows[0])
    previous = dict(rows[1]) if len(rows) > 1 else None
    inf_result = json.loads(latest["inference_result_json"]) if latest.get("inference_result_json") else {}

    twin = SkinDigitalTwin.build_twin_snapshot(latest, inf_result, previous)
    return jsonify({
        "has_twin": True,
        "digital_twin": twin,
        "latest_assessment_id": latest["id"]
    }), 200


@app.route("/api/twin/history", methods=["GET"])
@login_required
def get_twin_history():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, created_at, hydration, oiliness, sensitivity, redness, acne_concern,
               dryness, irritation, barrier_health_index, operating_mode
        FROM assessments
        WHERE user_id = ?
        ORDER BY created_at ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"snapshots": [dict(r) for r in rows]}), 200


# ==================== EXPLAINABLE REASONING ====================

@app.route("/api/reasoning/explain", methods=["GET", "POST"])
@login_required
def explain_reasoning():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()

    req_json = request.get_json(silent=True) or {}
    assessment_id = req_json.get("assessment_id") or request.args.get("assessment_id")

    if assessment_id:
        cursor.execute("SELECT * FROM assessments WHERE id = ? AND user_id = ?", (assessment_id, user_id))
    else:
        cursor.execute("SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "No assessment record found to explain."}), 404

    row_dict = dict(row)
    inf_res = json.loads(row_dict["inference_result_json"]) if row_dict.get("inference_result_json") else {}
    graph_data = ExplanationEngine.generate_explanation_graph(inf_res)

    return jsonify({
        "assessment_id": row_dict["id"],
        "timestamp": row_dict["created_at"],
        "reasoning_graph": graph_data,
        "operating_mode": inf_res.get("operating_mode", "NORMAL"),
        "primary_skin_state": inf_res.get("primary_skin_state", "Normal Skin"),
        "professional_alert": inf_res.get("professional_alert", False),
        "fired_rules": inf_res.get("fired_rules", []),
        "recommendations": inf_res.get("recommendations", [])
    }), 200


# ==================== PERSONALIZED SKINCARE ROUTINE ====================

def generate_and_save_routine_from_rules(user_id: int, inference_result: Dict[str, Any], questionnaire: Dict[str, Any], assessment_id: int = None):
    """Generates personalized morning and evening routines guided by expert system rules and questionnaire."""
    operating_mode = inference_result.get("operating_mode", "NORMAL")
    fired_ids = [r["rule_id"] for r in inference_result.get("fired_rules", [])]
    is_sensitive = "S02" in fired_ids or "R02" in fired_ids or questionnaire.get("sensitivity") in ["moderate", "high"]
    is_dry = "S01" in fired_ids or questionnaire.get("dryness_tightness") in ["moderate", "severe"]
    is_recovery = operating_mode == "RECOVERY_MODE" or "S03" in fired_ids

    # Morning routine
    morning_steps = [
        {
            "id": "m_cleanse",
            "name": "Gentle Physiological Cleanser or Lukewarm Rinse",
            "purpose": "Cleanses overnight metabolic buildup without stripping intercellular barrier lipids.",
            "instructions": "Splash with lukewarm water or apply a gentle non-foaming cleanser for 30s. Pat dry with clean towel.",
            "estimated_time": "1 min",
            "time_of_day": "morning",
            "category": "Cleanser",
            "ingredient_cautions": "Avoid harsh sulfates (SLS), abrasive scrubs, and essential oils.",
            "patch_test_guidance": "Test on jawline for 24 hours when introducing a new cleanser.",
            "is_active": False
        },
        {
            "id": "m_moisturizer",
            "name": "Soothing Ceramide Barrier Emulsion",
            "purpose": "Binds moisture in stratum corneum and fortifies natural skin barrier.",
            "instructions": "Smooth 1-2 pumps over damp face and neck. Gently press into skin.",
            "estimated_time": "1 min",
            "time_of_day": "morning",
            "category": "Moisturizer",
            "ingredient_cautions": "Formulated with Ceramides NP/AP/EOP, Cholesterol, and Glycerin.",
            "patch_test_guidance": "Hypoallergenic formulation suitable for compromised barriers.",
            "is_active": False
        },
        {
            "id": "m_sunscreen",
            "name": "Broad-Spectrum SPF 30+ Mineral Sunscreen",
            "purpose": "Essential defense against UVA photo-damage and UVB solar erythema.",
            "instructions": "Apply 1/4 teaspoon (approx 2 finger lengths) evenly across face and ears 15 minutes before stepping outdoors.",
            "estimated_time": "2 mins",
            "time_of_day": "morning",
            "category": "Photoprotection",
            "ingredient_cautions": "Broad-spectrum SPF 30 to 50+. Mineral Zinc Oxide is optimal for reactive skin.",
            "patch_test_guidance": "Reapply every 2 hours if continuously outdoors in direct sun.",
            "is_active": False
        }
    ]

    # Evening routine
    evening_steps = [
        {
            "id": "e_cleanse",
            "name": "Gentle Rinse / Low-Surfactant Cleanser",
            "purpose": "Removes sunscreen, sebum, and atmospheric particulate matter accumulated through the day.",
            "instructions": "Massage gently onto skin for 45-60 seconds. Rinse cleanly with lukewarm water.",
            "estimated_time": "2 mins",
            "time_of_day": "evening",
            "category": "Cleanser",
            "ingredient_cautions": "Free from irritating fragrance, alcohols, and physical scrub beads.",
            "patch_test_guidance": "Avoid hot water which accelerates transepidermal water loss.",
            "is_active": False
        },
        {
            "id": "e_repair",
            "name": "Nocturnal Barrier Recovery Cream / Balm",
            "purpose": "Facilitates overnight epidermal repair and prevents trans-epidermal moisture depletion.",
            "instructions": "Warm a blueberry-sized dollop between clean fingertips and gently press across face, focusing on dry cheek zones.",
            "estimated_time": "2 mins",
            "time_of_day": "evening",
            "category": "Barrier Repair",
            "ingredient_cautions": "No exfoliating acids (AHA/BHA), retinoids, or harsh peels during barrier soothing.",
            "patch_test_guidance": "Calming, restorative barrier lipid formula.",
            "is_active": False
        }
    ]

    routine_plan = {
        "mode": "SOOTHING" if (is_sensitive or is_recovery) else "NORMAL",
        "title": "Adaptive Soothing Routine" if (is_sensitive or is_recovery) else "Daily Barrier Maintenance Routine",
        "description": "Deterministic routine synthesized by the symbolic expert system based on user-reported comfort, observed exposure, and safety rules.",
        "soothing_mode_active": is_sensitive or is_recovery,
        "morning": morning_steps,
        "evening": evening_steps
    }

    save_or_update_routine_plan(user_id, routine_plan, routine_plan["mode"], assessment_id)
    return routine_plan


@app.route("/api/routine/current", methods=["GET"])
@login_required
def get_current_routine():
    user_id = request.current_user["id"]
    plan_record = get_user_routine_plan(user_id)
    if not plan_record:
        # Generate default baseline
        plan_dict = {
            "mode": "NORMAL",
            "title": "Daily Barrier Maintenance Routine",
            "description": "Standard soothing morning & evening skincare steps.",
            "soothing_mode_active": False,
            "morning": [],
            "evening": []
        }
        generate_and_save_routine_from_rules(user_id, {"operating_mode": "NORMAL", "fired_rules": []}, {})
        plan_record = get_user_routine_plan(user_id)

    today_str = datetime.now().strftime("%Y-%m-%d")
    today_tasks = get_user_routine_tasks(user_id, today_str)

    return jsonify({
        "routine": plan_record,
        "today_date": today_str,
        "today_tasks": today_tasks
    }), 200


@app.route("/api/routine/generate", methods=["POST"])
@login_required
def generate_routine():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    soothing_override = data.get("soothing_mode", False)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,))
    latest = cursor.fetchone()
    conn.close()

    if latest:
        inf_res = json.loads(latest["inference_result_json"]) if latest["inference_result_json"] else {}
        quest = json.loads(latest["user_questionnaire_json"]) if latest["user_questionnaire_json"] else {}
    else:
        inf_res = {"operating_mode": "NORMAL", "fired_rules": []}
        quest = {}

    if soothing_override:
        inf_res["operating_mode"] = "RECOVERY_MODE"

    routine = generate_and_save_routine_from_rules(user_id, inf_res, quest)
    return jsonify({"routine": routine, "message": "Routine successfully synthesized."}), 200


@app.route("/api/routine/tasks/complete", methods=["POST"])
@login_required
def complete_routine_task():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    time_of_day = data.get("time_of_day", "morning")
    step_id = data.get("step_id", "")
    step_name = data.get("step_name", "Skincare Step")
    feedback = data.get("feedback", "")

    if not step_id:
        return jsonify({"error": "step_id is required."}), 400

    log_routine_task_action(user_id, date_str, time_of_day, step_id, step_name, "completed", feedback)
    return jsonify({"message": f"Step '{step_name}' marked completed.", "status": "completed"}), 200


@app.route("/api/routine/tasks/skip", methods=["POST"])
@login_required
def skip_routine_task():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    time_of_day = data.get("time_of_day", "morning")
    step_id = data.get("step_id", "")
    step_name = data.get("step_name", "Skincare Step")
    status = data.get("status", "skipped")  # 'skipped' or 'unsuitable'
    feedback = data.get("feedback", "")

    if not step_id:
        return jsonify({"error": "step_id is required."}), 400

    log_routine_task_action(user_id, date_str, time_of_day, step_id, step_name, status, feedback)
    return jsonify({"message": f"Step '{step_name}' marked as {status}.", "status": status}), 200


@app.route("/api/routine/tasks/toggle", methods=["POST"])
@login_required
def toggle_routine_task():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    time_of_day = data.get("time_of_day", "morning")
    step_id = data.get("step_id", "")
    step_name = data.get("step_name", "Skincare Step")

    if not step_id:
        return jsonify({"error": "step_id is required."}), 400

    new_status = toggle_routine_task_action(user_id, date_str, time_of_day, step_id, step_name)
    return jsonify({"message": f"Step '{step_name}' updated.", "status": new_status}), 200


@app.route("/api/routine/tasks/reset", methods=["POST"])
@login_required
def reset_routine_tasks():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")

    deleted = reset_user_routine_tasks(user_id, date_str)
    return jsonify({"message": "Today's routine checklist has been reset.", "reset_count": deleted}), 200


# ==================== RECOVERY TIMELINE & TRACKER ====================

@app.route("/api/recovery/timeline", methods=["GET"])
@login_required
def get_recovery_timeline():
    user_id = request.current_user["id"]
    days_param = request.args.get("days", 14)
    try:
        days = int(days_param)
        if days not in [7, 14, 28]:
            days = 14
    except ValueError:
        days = 14

    today = datetime.now().date()
    start_date = today - timedelta(days=days - 1)

    # 1. Fetch completed tasks in period
    all_tasks = get_user_routine_tasks(user_id)
    # Filter by date range
    tasks_by_date = {}
    total_completed = 0
    total_skipped = 0

    for t in all_tasks:
        d_str = t.get("date")
        if d_str:
            try:
                t_date = datetime.strptime(d_str, "%Y-%m-%d").date()
                if start_date <= t_date <= today:
                    if d_str not in tasks_by_date:
                        tasks_by_date[d_str] = []
                    tasks_by_date[d_str].append(t)
                    if t.get("status") == "completed":
                        total_completed += 1
                    else:
                        total_skipped += 1
            except ValueError:
                pass

    # Expected tasks: active routine has N steps per day
    plan = get_user_routine_plan(user_id)
    daily_step_count = 5
    if plan and "plan_json" in plan:
        pj = plan["plan_json"]
        daily_step_count = len(pj.get("morning", [])) + len(pj.get("evening", [])) or 5

    total_expected = days * daily_step_count
    adherence_pct = min(100, int((total_completed / max(1, total_expected)) * 100))

    # 2. Fetch daily symptom checkins in period
    symptom_history = get_user_symptom_history(user_id, days)

    # 3. Fetch Twin snapshots history in period
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, created_at, barrier_health_index, hydration, oiliness, sensitivity, redness, operating_mode
        FROM assessments
        WHERE user_id = ?
        ORDER BY created_at ASC
    """, (user_id,))
    assessment_history = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Safety alert check for worsening symptoms
    recent_irritations = [s.get("irritation_rating", 0) for s in symptom_history[-3:]] if len(symptom_history) >= 3 else []
    is_worsening = len(recent_irritations) >= 3 and recent_irritations[-1] > recent_irritations[0] + 2.0

    return jsonify({
        "review_period_days": days,
        "adherence_percentage": adherence_pct,
        "total_completed_tasks": total_completed,
        "total_skipped_tasks": total_skipped,
        "daily_step_count": daily_step_count,
        "daily_adherence_data": [
            {
                "date": (start_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                "day_label": (start_date + timedelta(days=i)).strftime("%b %d"),
                "completed": len([t for t in tasks_by_date.get((start_date + timedelta(days=i)).strftime("%Y-%m-%d"), []) if t.get("status") == "completed"]),
                "target": daily_step_count
            }
            for i in range(days)
        ],
        "symptom_ratings_history": symptom_history,
        "twin_progression": assessment_history,
        "is_worsening_trend": is_worsening,
        "safety_guidance": "If irritation or discomfort escalates rather than settling over 7-14 days, pause active cosmetic routines and consult a medical doctor or licensed dermatologist." if is_worsening else "Tracking progress without fabricating guarantees. Consistency supports natural epidermal turnover."
    }), 200


# ==================== SYMPTOM CHECK-IN ====================

@app.route("/api/symptoms/checkin", methods=["GET", "POST"])
@login_required
def handle_symptom_checkin():
    user_id = request.current_user["id"]
    if request.method == "POST":
        data = request.get_json() or {}
        date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
        comfort = float(data.get("comfort_rating", 7.0))
        dryness = float(data.get("dryness_rating", 3.0))
        irritation = float(data.get("irritation_rating", 2.0))
        notes = data.get("notes", "")

        record_symptom_checkin(user_id, date_str, comfort, dryness, irritation, notes)
        return jsonify({"message": "Daily skin comfort check-in recorded successfully."}), 201
    else:
        history = get_user_symptom_history(user_id, 30)
        return jsonify({"checkins": history}), 200


# ==================== FOOD & HYDRATION PLANNER ====================

@app.route("/api/food/plan", methods=["GET"])
@login_required
def get_food_plan():
    """Returns balanced nutrition & hydration suggestions respecting Indian dietary preferences."""
    user_id = request.current_user["id"]
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Fetch user's logged diary for today
    today_diary = get_user_food_diary(user_id, today_str)
    hydration_logs = get_user_hydration_logs(user_id, 7)

    today_hydration = next((h for h in hydration_logs if h.get("date") == today_str), {"amount_ml": 0, "glasses": 0})

    meal_guidelines = {
        "disclaimer": "Nutritional suggestions complement general daily wellness. Food alone does not cure or diagnose dermatological medical diseases.",
        "dietary_style": "Indian Balanced & Mediterranean Supportive Options",
        "meals": [
            {
                "meal_type": "breakfast",
                "title": "Balanced Morning Breakfast",
                "suggestions": [
                    {"name": "Steamed Idli with Vegetable Sambar", "tags": ["Indian", "Vegetarian", "Easily Digestible"]},
                    {"name": "Rolled Oats cooked with crushed Almonds & Berries", "tags": ["Fiber Rich", "Antioxidants"]},
                    {"name": "Moong Dal Cheela with fresh Mint Chutney", "tags": ["Indian", "Vegetarian", "High Protein"]},
                    {"name": "Boiled Eggs with whole grain toast & Cucumber slices", "tags": ["Protein", "Zinc"]}
                ]
            },
            {
                "meal_type": "lunch",
                "title": "Midday Balanced Meal",
                "suggestions": [
                    {"name": "Brown / Steamed Rice with Yellow Dal Tadka, Spinach (Palak), and Curd / Raita", "tags": ["Indian", "Vegetarian", "Gut Friendly"]},
                    {"name": "Roti with Paneer Bhurji / Tofu, mixed Bell Peppers and Salad", "tags": ["Vegetarian", "Protein", "Vitamin C"]},
                    {"name": "Grilled Fish / Grilled Chicken with steamed beans & Millet Roti", "tags": ["Omega-3", "Lean Protein"]}
                ]
            },
            {
                "meal_type": "snack",
                "title": "Healthy Afternoon Refreshment",
                "suggestions": [
                    {"name": "Fresh Papaya / Pomegranate / Guava bowl", "tags": ["Vitamin C", "Digestive"]},
                    {"name": "Roasted Makhana (Foxnuts) with light salt", "tags": ["Low Glycemic", "Indian"]},
                    {"name": "Plain Yogurt (Curd) with roasted Flaxseeds & Walnuts", "tags": ["Omega-3", "Probiotic"]}
                ]
            },
            {
                "meal_type": "dinner",
                "title": "Light Physiological Dinner",
                "suggestions": [
                    {"name": "Warm Khichdi with Mixed Vegetables, Ghee (1 tsp), and Cucumber Salad", "tags": ["Indian", "Vegetarian", "Soothing"]},
                    {"name": "Clear Vegetable & Lentil Soup with Roasted Paneer / Tofu skewers", "tags": ["Light", "Nutritious"]},
                    {"name": "Methi Roti with Lauki (Bottle Gourd) Sabzi and Dal", "tags": ["Vegetarian", "Low Inflammation"]}
                ]
            }
        ],
        "hydration_target": {
            "daily_target_ml": 2500,
            "target_glasses": 10,
            "rationale": "Maintains systemic physiological hydration. Drink steadily through the day rather than overloading at night."
        }
    }

    return jsonify({
        "plan": meal_guidelines,
        "today_food_entries": today_diary,
        "today_hydration": today_hydration,
        "hydration_history": hydration_logs
    }), 200


@app.route("/api/food/diary", methods=["GET", "POST"])
@login_required
def handle_food_diary():
    user_id = request.current_user["id"]
    if request.method == "POST":
        data = request.get_json() or {}
        date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
        meal_type = data.get("meal_type", "breakfast")
        food_items = data.get("food_items", "")
        tags = data.get("tags", "")
        symptom_obs = data.get("symptom_observation", "")

        if not food_items:
            return jsonify({"error": "food_items is required."}), 400

        entry_id = record_food_diary_entry(user_id, date_str, meal_type, food_items, tags, symptom_obs)
        return jsonify({"message": "Meal logged to food diary.", "entry_id": entry_id}), 201
    else:
        date_str = request.args.get("date")
        entries = get_user_food_diary(user_id, date_str)
        return jsonify({"entries": entries}), 200


@app.route("/api/hydration/log", methods=["POST"])
@login_required
def log_hydration():
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    amount_ml = int(data.get("amount_ml", 250))
    glasses = int(data.get("glasses", 1))

    record_hydration_log(user_id, date_str, amount_ml, glasses)
    return jsonify({"message": "Hydration recorded successfully.", "amount_ml": amount_ml, "glasses": glasses}), 200


# ==================== REMINDERS & NOTIFICATIONS ====================

@app.route("/api/reminders", methods=["GET", "POST"])
@login_required
def handle_reminders():
    user_id = request.current_user["id"]
    if request.method == "POST":
        data = request.get_json() or {}
        r_id = create_or_update_reminder(user_id, data)
        return jsonify({"message": "Reminder configured.", "reminder_id": r_id}), 201
    else:
        reminders = get_user_reminders(user_id)
        return jsonify({"reminders": reminders}), 200


@app.route("/api/reminders/<int:reminder_id>", methods=["PUT", "DELETE"])
@login_required
def manage_single_reminder(reminder_id):
    user_id = request.current_user["id"]
    if request.method == "PUT":
        data = request.get_json() or {}
        data["id"] = reminder_id
        create_or_update_reminder(user_id, data)
        return jsonify({"message": "Reminder updated."}), 200
    else:
        success = delete_user_reminder(user_id, reminder_id)
        if success:
            return jsonify({"message": "Reminder removed."}), 200
        return jsonify({"error": "Reminder not found."}), 404


# ==================== SKIN ASSESSMENT REPORTS ====================

# ==================== SKIN ASSESSMENT REPORTS ====================

def format_assessment_report(row: dict, user: dict, inf_result: dict, quest: dict, obs: dict) -> dict:
    """Formats an assessment record into a neat, human-friendly skincare report."""
    # 1. Computed photo quality values
    exposure_val = obs.get("metrics", {}).get("brightness") or obs.get("exposure", {}).get("mean_luminance", 120.0)
    sharpness_val = obs.get("metrics", {}).get("sharpness") or obs.get("sharpness", {}).get("variance", 55.0)
    face_coverage_val = obs.get("metrics", {}).get("face_coverage_percent") or 35.0

    lighting_status = "Good" if (45 <= float(exposure_val) <= 220) else "Needs improvement"
    clarity_status = "Clear" if float(sharpness_val) >= 30.0 else "Blurry"
    face_status = "Successful" if obs.get("face_count", 1) == 1 else "Unsuccessful"

    overall_photo_quality = "Good" if (lighting_status == "Good" and clarity_status == "Clear" and face_status == "Successful") else "Needs improvement"

    if obs.get("status") == "SKIPPED_OR_MANUAL":
        what_we_noticed = "The questionnaire was completed without a camera check."
    elif overall_photo_quality == "Good":
        what_we_noticed = "The photo is clear and well-lit for a basic visual check."
    elif lighting_status == "Needs improvement":
        what_we_noticed = "The photo is too dark or has harsh glare for an optimal check. Please try in brighter, softer light."
    else:
        what_we_noticed = "The image appeared slightly blurry. Holding steady in good lighting gives the clearest photo."

    # 2. User's self-reported answers
    skin_feeling = quest.get("skin_feeling") or quest.get("skin_type") or "Not sure"
    main_concern = quest.get("main_concern") or quest.get("concern") or "General skincare routine"
    discomfort = quest.get("discomfort_after_washing") or quest.get("dryness_tightness") or "Sometimes"

    user_answers = {
        "skin_feeling": skin_feeling.capitalize() if isinstance(skin_feeling, str) else str(skin_feeling),
        "main_concern": main_concern.capitalize() if isinstance(main_concern, str) else str(main_concern),
        "discomfort_after_washing": discomfort.capitalize() if isinstance(discomfort, str) else str(discomfort)
    }

    # 3. Practical Skincare Suggestions (3 to 5 simple evidence-based recommendations)
    suggestions = []
    why_explanations = []

    # Rule-based suggestions based on user reported feel & washing discomfort
    s_feel_lower = str(skin_feeling).lower()
    c_lower = str(main_concern).lower()
    d_lower = str(discomfort).lower()

    if "dry" in s_feel_lower or "yes" in d_lower or "tight" in d_lower:
        suggestions.append("Clean your face gently using lukewarm water and a mild, non-foaming hydrating cleanser.")
        why_explanations.append({
            "trigger": "Reported dry feeling or discomfort after washing",
            "reason": "Harsh foaming agents can strip intercellular lipids from the skin's moisture barrier, leading to tightness."
        })
        suggestions.append("Apply a rich ceramide-based moisturiser within one minute after rinsing while skin is slightly damp.")
        why_explanations.append({
            "trigger": "Skin dryness / barrier support",
            "reason": "Moisturising on damp skin seals in hydration and replenishes essential barrier lipids."
        })
    elif "oil" in s_feel_lower or "oil" in c_lower:
        suggestions.append("Clean your face gently twice daily with a balanced, gentle gel cleanser.")
        why_explanations.append({
            "trigger": "Reported oily feel or concern",
            "reason": "Gentle regular cleansing lifts excess sebum without triggering rebound oiliness."
        })
        suggestions.append("Use a lightweight, oil-free gel moisturiser to keep skin hydrated without clogging pores.")
        why_explanations.append({
            "trigger": "Balancing hydration for oily skin",
            "reason": "Oily skin still requires hydration; lightweight formulas provide moisture without heavy occlusives."
        })
    else:
        suggestions.append("Clean your face gently with a mild, pH-balanced cleanser morning and evening.")
        why_explanations.append({
            "trigger": "Balanced daily maintenance",
            "reason": "Maintains normal epidermal pH and clears ambient particulate matter without over-cleansing."
        })
        suggestions.append("Apply a suitable daily moisturiser to maintain comfortable, consistent hydration.")
        why_explanations.append({
            "trigger": "Everyday barrier care",
            "reason": "Provides daily equilibrium and guards against trans-epidermal water loss."
        })

    # Sunscreen rule (universal photoprotection)
    suggestions.append("Apply broad-spectrum SPF 30+ sunscreen every morning before heading outdoors.")
    why_explanations.append({
        "trigger": "Daily photoprotection principle",
        "reason": "Solar UVA and UVB rays degrade collagen and induce cellular inflammation regardless of skin type."
    })

    # Sensitivity / new products caution rule
    if "red" in c_lower or "irritat" in c_lower or "yes" in d_lower:
        suggestions.append("Avoid introducing several new skincare products at once if your skin feels sensitive.")
        why_explanations.append({
            "trigger": "Redness, irritation, or skin sensitivity",
            "reason": "Introducing products one at a time makes it easy to identify individual ingredient sensitivities."
        })

    suggestions.append("Consider consulting a licensed dermatologist or doctor if redness or discomfort persists.")
    why_explanations.append({
        "trigger": "Clinical safety guideline",
        "reason": "Webcam checks and student rule systems provide educational habit guidance, not medical diagnoses."
    })

    # Daily Routine steps
    morning_routine = [
        {"step": 1, "action": "Gently cleanse your face", "detail": "Splash with lukewarm water or a gentle, non-stripping cleanser."},
        {"step": 2, "action": "Apply moisturiser", "detail": "Smooth on a gentle moisturiser while your skin is damp."},
        {"step": 3, "action": "Apply broad-spectrum SPF 30+ sunscreen", "detail": "Apply evenly across face and neck before sun exposure."}
    ]

    evening_routine = [
        {"step": 1, "action": "Clean your face gently", "detail": "Massage cleanser gently to wash off daily dirt, oil, and sunscreen."},
        {"step": 2, "action": "Apply moisturiser", "detail": "Apply moisturiser to support overnight skin recovery."}
    ]

    return {
        "report_id": f"RPT-{row['id']:04d}",
        "assessment_id": row["id"],
        "generated_at": row["created_at"],
        "user_name": user.get("full_name", "Student / User"),
        "user_email": user.get("email", ""),
        "photo_quality": overall_photo_quality,
        "photo_quality_details": {
            "lighting": lighting_status,
            "image_clarity": clarity_status,
            "face_detection": face_status
        },
        "photo_metrics": {
            "brightness": round(float(exposure_val), 1),
            "brightness_percent": min(100.0, round((float(exposure_val) / 255.0) * 100, 1)),
            "sharpness": round(float(sharpness_val), 1),
            "sharpness_scaled": min(100.0, round((float(sharpness_val) / 250.0) * 100, 1)),
            "face_coverage_percent": round(float(face_coverage_val), 1)
        },
        "what_we_noticed": what_we_noticed,
        "user_answers": user_answers,
        "skincare_suggestions": suggestions,
        "why_am_i_seeing_this": why_explanations,
        "daily_routine": {
            "morning": morning_routine,
            "evening": evening_routine
        },
        "safety_disclaimer": "This report provides general skincare guidance generated by a student rule-based system. An ordinary webcam cannot measure skin hydration, sebum production, or diagnose medical conditions."
    }


@app.route("/api/reports/latest", methods=["GET"])
@login_required
def get_latest_report():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "No assessment record found."}), 404

    row_dict = dict(row)
    inf_res = json.loads(row_dict["inference_result_json"]) if row_dict.get("inference_result_json") else {}
    quest = json.loads(row_dict["user_questionnaire_json"]) if row_dict.get("user_questionnaire_json") else {}
    obs = json.loads(row_dict["image_observations_json"]) if row_dict.get("image_observations_json") else {}

    report = format_assessment_report(row_dict, request.current_user, inf_res, quest, obs)
    return jsonify(report), 200


@app.route("/api/reports/history", methods=["GET"])
@login_required
def get_reports_history():
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    reports = []
    for r in rows:
        r_dict = dict(r)
        try:
            inf_res = json.loads(r_dict["inference_result_json"]) if r_dict.get("inference_result_json") else {}
            quest = json.loads(r_dict["user_questionnaire_json"]) if r_dict.get("user_questionnaire_json") else {}
            obs = json.loads(r_dict["image_observations_json"]) if r_dict.get("image_observations_json") else {}
            rep = format_assessment_report(r_dict, request.current_user, inf_res, quest, obs)
            reports.append(rep)
        except Exception:
            pass

    return jsonify({"reports": reports}), 200


@app.route("/api/reports/save", methods=["POST"])
@login_required
def save_report():
    data = request.get_json() or {}
    assessment_id = data.get("assessment_id")
    # All assessments are already persistently stored in SQLite
    return jsonify({"message": "Report successfully saved to your skin history.", "saved": True, "assessment_id": assessment_id}), 200


@app.route("/api/reports/<int:assessment_id>", methods=["GET"])
@login_required
def get_report_by_id(assessment_id):
    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM assessments WHERE id = ? AND user_id = ?
    """, (assessment_id, user_id))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Report not found."}), 404

    row_dict = dict(row)
    inf_res = json.loads(row_dict["inference_result_json"]) if row_dict.get("inference_result_json") else {}
    quest = json.loads(row_dict["user_questionnaire_json"]) if row_dict.get("user_questionnaire_json") else {}
    obs = json.loads(row_dict["image_observations_json"]) if row_dict.get("image_observations_json") else {}

    report = format_assessment_report(row_dict, request.current_user, inf_res, quest, obs)
    return jsonify(report), 200


@app.route("/api/user/profile", methods=["GET"])
@login_required
def get_user_profile():
    user = request.current_user
    stats = get_user_profile_stats(user["id"])
    return jsonify({
        "user": user,
        "stats": stats,
        "smtp_configured": is_smtp_configured()
    }), 200


# ==================== PRIVACY & DATA PURGE ====================

@app.route("/api/user/data", methods=["DELETE"])
@login_required
def purge_user_data():
    user_id = request.current_user["id"]
    result = delete_all_user_data(user_id)
    return jsonify(result), 200


# ==================== SIMULATION & KNOWLEDGE BASE ====================

@app.route("/api/simulation", methods=["POST"])
def run_simulation():
    data = request.get_json() or {}
    baseline = data.get("baseline", {})
    overrides = data.get("overrides", {})
    if not baseline:
        baseline = {
            "hydration": 55, "oiliness": 50, "sensitivity": 25, "redness": 20,
            "acne_concern": 25, "dryness": 30, "irritation": 20, "barrier_concern": 20,
            "temperature": 24, "humidity": 50, "uv_index": 3, "sleep_hours": 7.5,
            "outdoor_hours": 2.0, "symptoms": {}
        }
    simulation_result = simulator.simulate(baseline, overrides)
    return jsonify(simulation_result), 200


@app.route("/api/knowledge-base/rules", methods=["GET"])
def get_knowledge_base_rules():
    rule_docs = [
        {
            "rule_id": r.rule_id,
            "name": r.name,
            "category": r.category,
            "priority": r.priority,
            "conditions_summary": r.conditions_summary,
            "description": r.description,
            "faculty_rationale": r.faculty_rationale,
            "consequents": r.consequents_dict,
            "suppressions": r.suppressions
        }
        for r in all_rules
    ]
    return jsonify({"rules": rule_docs, "total_rules": len(rule_docs)}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(host=host, port=port, debug=debug)
