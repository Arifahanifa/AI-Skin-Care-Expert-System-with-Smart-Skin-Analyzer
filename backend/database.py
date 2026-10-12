"""
Database Module for AI Skin Care Expert System.
Uses SQLite for persistent storage of users, assessments, digital twins,
routine plans, task tracking, symptom check-ins, food & hydration logs, and reminders.
Includes cryptographic password hashing, user data isolation, and privacy deletion controls.
"""

import sqlite3
import hashlib
import os
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "skincare_expert.db"))
_db_dir = os.path.dirname(DB_PATH)
if _db_dir and not os.path.exists(_db_dir):
    try:
        os.makedirs(_db_dir, exist_ok=True)
    except Exception:
        pass


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str, salt: bytes = None) -> str:
    """Hashes password using PBKDF2-HMAC-SHA256 with random salt."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"


def verify_password(stored_hash: str, provided_password: str) -> bool:
    """Verifies provided password against stored salt:hash."""
    try:
        salt_hex, key_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt, 100000)
        return key == expected_key
    except Exception:
        return False


def init_db():
    """Initializes tables, applies schema migrations, and seeds demo account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Safe migration for username in users table
    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = [row["name"] for row in cursor.fetchall()]
    if "username" not in existing_user_cols:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
            cursor.execute("SELECT id, email FROM users WHERE username IS NULL OR username = ''")
            for u in cursor.fetchall():
                uname = u["email"].split("@")[0].replace(".", "_") + f"_{u['id']}"
                cursor.execute("UPDATE users SET username = ? WHERE id = ?", (uname, u["id"]))
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        except Exception as e:
            print(f"Username migration note: {e}")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        reset_code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        used INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Safe migration for attempts in password_resets
    cursor.execute("PRAGMA table_info(password_resets)")
    existing_pr_cols = [row["name"] for row in cursor.fetchall()]
    if "attempts" not in existing_pr_cols:
        try:
            cursor.execute("ALTER TABLE password_resets ADD COLUMN attempts INTEGER DEFAULT 0")
        except Exception as e:
            print(f"Attempts migration note: {e}")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hydration REAL NOT NULL,
        oiliness REAL NOT NULL,
        sensitivity REAL NOT NULL,
        redness REAL NOT NULL,
        acne_concern REAL NOT NULL,
        dryness REAL NOT NULL,
        irritation REAL NOT NULL,
        barrier_concern REAL NOT NULL,
        temperature REAL,
        humidity REAL,
        uv_index REAL,
        sleep_hours REAL,
        outdoor_hours REAL,
        newly_introduced_products INTEGER DEFAULT 0,
        symptoms_json TEXT,
        barrier_health_index INTEGER,
        operating_mode TEXT,
        primary_skin_state TEXT,
        completeness_score INTEGER,
        inference_result_json TEXT,
        image_observations_json TEXT,
        user_questionnaire_json TEXT,
        rule_conclusions_json TEXT,
        confirmed_by_user INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Safe column migrations for assessments table if previously created
    cursor.execute("PRAGMA table_info(assessments)")
    existing_cols = [row["name"] for row in cursor.fetchall()]
    migration_cols = [
        ("image_observations_json", "TEXT"),
        ("user_questionnaire_json", "TEXT"),
        ("rule_conclusions_json", "TEXT"),
        ("confirmed_by_user", "INTEGER DEFAULT 1")
    ]
    for col_name, col_type in migration_cols:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE assessments ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Migration note for {col_name}: {e}")

    # Routine Plans Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routine_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        assessment_id INTEGER,
        mode TEXT NOT NULL DEFAULT 'NORMAL',
        plan_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Routine Tasks Adherence Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routine_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time_of_day TEXT NOT NULL,
        step_id TEXT NOT NULL,
        step_name TEXT NOT NULL,
        status TEXT NOT NULL,
        user_feedback TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Daily Symptom Check-ins
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS symptom_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        comfort_rating REAL NOT NULL,
        dryness_rating REAL NOT NULL,
        irritation_rating REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Food Diary
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        food_items TEXT NOT NULL,
        dietary_tags TEXT,
        symptom_observation TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Hydration Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hydration_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        amount_ml INTEGER NOT NULL,
        glasses INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Reminders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reminder_type TEXT NOT NULL,
        title TEXT NOT NULL,
        time TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        days_json TEXT DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]',
        last_triggered TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()


def seed_default_routine_and_reminders(cursor, user_id: int):
    """Seeds default realistic routine plan and reminders for a user."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Default Routine Plan
    default_plan = {
        "mode": "NORMAL",
        "title": "Gentle Barrier & Hydration Routine",
        "description": "Evidence-grounded daily routine focused on physiological barrier equilibrium and UV protection.",
        "morning": [
            {
                "id": "m_cleanse",
                "name": "Gentle Morning Rinse / Cleanser",
                "purpose": "Removes overnight metabolic debris without stripping stratum corneum intercellular lipids.",
                "instructions": "Splash with lukewarm water or massage a dime-sized amount of non-foaming pH 5.5 cleanser for 30s. Pat dry gently.",
                "estimated_time": "1 min",
                "time_of_day": "morning",
                "category": "Cleanser",
                "ingredient_cautions": "Avoid harsh sodium lauryl sulfate (SLS) and synthetic fragrances.",
                "patch_test_guidance": "Patch test behind ear for 24h if starting a new cleanser.",
                "is_active": False
            },
            {
                "id": "m_moisturize",
                "name": "Lightweight Barrier Hydrator",
                "purpose": "Replenishes skin natural moisturizing factors (NMF) and locks in hydration.",
                "instructions": "Apply 1-2 pumps onto damp skin, smoothing gently over face and neck in upward motions.",
                "estimated_time": "1 min",
                "time_of_day": "morning",
                "category": "Moisturizer",
                "ingredient_cautions": "Formulated with Ceramides, Hyaluronic Acid, and Glycerin.",
                "patch_test_guidance": "Safe for daily use; monitor for transient redness if formula contains preservatives.",
                "is_active": False
            },
            {
                "id": "m_sunscreen",
                "name": "Broad-Spectrum SPF 30+ Sunscreen",
                "purpose": "Shields against solar UVA (photoaging) and UVB (erythema/carcinogenesis) radiation.",
                "instructions": "Apply two finger lengths (approx 1/4 teaspoon) evenly across face and ears 15 minutes before sun exposure.",
                "estimated_time": "2 mins",
                "time_of_day": "morning",
                "category": "Photoprotection",
                "ingredient_cautions": "Broad-spectrum SPF 30 to 50+. Reapply every 2 hours during continuous direct outdoor sun.",
                "patch_test_guidance": "Mineral (Zinc Oxide/Titanium Dioxide) sunscreens are well tolerated by reactive skin.",
                "is_active": False
            }
        ],
        "evening": [
            {
                "id": "e_cleanse",
                "name": "Gentle Lipid-Preserving Cleanser",
                "purpose": "Effectively lifts sunscreen, particulate matter, and urban sebum accumulation.",
                "instructions": "Massage gently onto skin for 45-60 seconds. Rinse thoroughly with lukewarm water. Do not scrub with washcloths.",
                "estimated_time": "2 mins",
                "time_of_day": "evening",
                "category": "Cleanser",
                "ingredient_cautions": "Free from physical abrasive microbeads, exfoliating acids, or drying alcohol.",
                "patch_test_guidance": "Crucial daily hygiene step after sun protection.",
                "is_active": False
            },
            {
                "id": "e_barrier",
                "name": "Nourishing Ceramide Barrier Balm / Cream",
                "purpose": "Facilitates nocturnal epidermal barrier recovery and limits transepidermal water loss (TEWL).",
                "instructions": "Warm a blueberry-sized amount between fingers and press onto face. Concentrate on dry cheek zones.",
                "estimated_time": "2 mins",
                "time_of_day": "evening",
                "category": "Barrier Repair",
                "ingredient_cautions": "Contains 3:1:1 physiological ratio of Ceramides, Cholesterol, and Free Fatty Acids.",
                "patch_test_guidance": "Excellent for soothing and repairing irritated cutaneous layers.",
                "is_active": False
            }
        ]
    }

    cursor.execute("""
        INSERT INTO routine_plans (user_id, mode, plan_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, "NORMAL", json.dumps(default_plan), now_str, now_str))

    # Seed Default Reminders
    default_reminders = [
        ("morning_skincare", "Morning Skincare Routine", "08:00"),
        ("sunscreen_reapplication", "Sunscreen Reapplication (Midday)", "12:30"),
        ("hydration", "Hydration Check (Drink a Glass of Water)", "14:00"),
        ("evening_skincare", "Evening Skincare & Barrier Repair", "21:30"),
        ("comfort_checkin", "Daily Skin Comfort & Irritation Check-in", "22:00")
    ]
    for r_type, title, r_time in default_reminders:
        cursor.execute("""
            INSERT INTO reminders (user_id, reminder_type, title, time, is_enabled, days_json, created_at)
            VALUES (?, ?, ?, ?, 1, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]', ?)
        """, (user_id, r_type, title, r_time, now_str))

    # Seed some initial routine task completions for yesterday and today
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    cursor.execute("""
        INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
        VALUES (?, ?, 'morning', 'm_cleanse', 'Gentle Morning Rinse / Cleanser', 'completed', 'Skin felt refreshed', ?)
    """, (user_id, yesterday, now_str))
    cursor.execute("""
        INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
        VALUES (?, ?, 'morning', 'm_moisturize', 'Lightweight Barrier Hydrator', 'completed', 'Very hydrating', ?)
    """, (user_id, yesterday, now_str))
    cursor.execute("""
        INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
        VALUES (?, ?, 'morning', 'm_sunscreen', 'Broad-Spectrum SPF 30+ Sunscreen', 'completed', 'Applied evenly', ?)
    """, (user_id, yesterday, now_str))
    cursor.execute("""
        INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
        VALUES (?, ?, 'evening', 'e_cleanse', 'Gentle Lipid-Preserving Cleanser', 'completed', 'No irritation', ?)
    """, (user_id, yesterday, now_str))

    # Seed initial symptom checkin
    cursor.execute("""
        INSERT INTO symptom_checkins (user_id, date, comfort_rating, dryness_rating, irritation_rating, notes, created_at)
        VALUES (?, ?, 7.5, 3.0, 2.0, 'Mild tightness around cheekbones in afternoon AC', ?)
    """, (user_id, yesterday, now_str))

    # Seed initial hydration log
    cursor.execute("""
        INSERT INTO hydration_logs (user_id, date, amount_ml, glasses, created_at)
        VALUES (?, ?, 2000, 8, ?)
    """, (user_id, yesterday, now_str))


def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Resolves authenticated user from token."""
    if not token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.username, u.full_name, u.created_at
        FROM users u
        JOIN auth_tokens t ON u.id = t.user_id
        WHERE t.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


# ==================== ROUTINE DB HELPERS ====================

def get_user_routine_plan(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM routine_plans
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        plan = dict(row)
        try:
            plan["plan_json"] = json.loads(plan["plan_json"])
        except Exception:
            pass
        return plan
    return None


def save_or_update_routine_plan(user_id: int, plan_dict: Dict[str, Any], mode: str = "NORMAL", assessment_id: Optional[int] = None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        SELECT id FROM routine_plans WHERE user_id = ?
    """, (user_id,))
    existing = cursor.fetchone()

    plan_json_str = json.dumps(plan_dict)
    if existing:
        cursor.execute("""
            UPDATE routine_plans
            SET mode = ?, plan_json = ?, updated_at = ?, assessment_id = ?
            WHERE id = ?
        """, (mode, plan_json_str, now_str, assessment_id, existing["id"]))
        plan_id = existing["id"]
    else:
        cursor.execute("""
            INSERT INTO routine_plans (user_id, assessment_id, mode, plan_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, assessment_id, mode, plan_json_str, now_str, now_str))
        plan_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return plan_id


def log_routine_task_action(user_id: int, date_str: str, time_of_day: str, step_id: str, step_name: str, status: str, feedback: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Check if task was already marked for this date and step
    cursor.execute("""
        SELECT id FROM routine_tasks
        WHERE user_id = ? AND date = ? AND step_id = ?
    """, (user_id, date_str, step_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE routine_tasks
            SET status = ?, user_feedback = ?, created_at = ?
            WHERE id = ?
        """, (status, feedback, now_str, existing["id"]))
    else:
        cursor.execute("""
            INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, date_str, time_of_day, step_id, step_name, status, feedback, now_str))

    conn.commit()
    conn.close()


def get_user_routine_tasks(user_id: int, date_str: str = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if date_str:
        cursor.execute("""
            SELECT * FROM routine_tasks
            WHERE user_id = ? AND date = ?
            ORDER BY created_at ASC
        """, (user_id, date_str))
    else:
        cursor.execute("""
            SELECT * FROM routine_tasks
            WHERE user_id = ?
            ORDER BY date DESC, created_at ASC
        """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def reset_user_routine_tasks(user_id: int, date_str: str = None) -> int:
    """Resets today's routine tasks for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("""
        DELETE FROM routine_tasks
        WHERE user_id = ? AND date = ?
    """, (user_id, date_str))
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted_count


def toggle_routine_task_action(user_id: int, date_str: str, time_of_day: str, step_id: str, step_name: str) -> str:
    """Toggles a routine task between completed and not done."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        SELECT id, status FROM routine_tasks
        WHERE user_id = ? AND date = ? AND step_id = ?
    """, (user_id, date_str, step_id))
    existing = cursor.fetchone()

    if existing:
        if existing["status"] == "completed":
            # Remove completion
            cursor.execute("DELETE FROM routine_tasks WHERE id = ?", (existing["id"],))
            new_status = "pending"
        else:
            cursor.execute("""
                UPDATE routine_tasks SET status = 'completed', created_at = ?
                WHERE id = ?
            """, (now_str, existing["id"]))
            new_status = "completed"
    else:
        cursor.execute("""
            INSERT INTO routine_tasks (user_id, date, time_of_day, step_id, step_name, status, user_feedback, created_at)
            VALUES (?, ?, ?, ?, ?, 'completed', '', ?)
        """, (user_id, date_str, time_of_day, step_id, step_name, now_str))
        new_status = "completed"

    conn.commit()
    conn.close()
    return new_status


# ==================== SYMPTOM CHECK-IN HELPERS ====================


def record_symptom_checkin(user_id: int, date_str: str, comfort: float, dryness: float, irritation: float, notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        SELECT id FROM symptom_checkins WHERE user_id = ? AND date = ?
    """, (user_id, date_str))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE symptom_checkins
            SET comfort_rating = ?, dryness_rating = ?, irritation_rating = ?, notes = ?, created_at = ?
            WHERE id = ?
        """, (comfort, dryness, irritation, notes, now_str, existing["id"]))
    else:
        cursor.execute("""
            INSERT INTO symptom_checkins (user_id, date, comfort_rating, dryness_rating, irritation_rating, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, date_str, comfort, dryness, irritation, notes, now_str))

    conn.commit()
    conn.close()


def get_user_symptom_history(user_id: int, limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM symptom_checkins
        WHERE user_id = ?
        ORDER BY date ASC
        LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== FOOD & HYDRATION HELPERS ====================

def record_food_diary_entry(user_id: int, date_str: str, meal_type: str, food_items: str, tags: str = "", symptom_obs: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO food_diary (user_id, date, meal_type, food_items, dietary_tags, symptom_observation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, date_str, meal_type, food_items, tags, symptom_obs, now_str))
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return entry_id


def get_user_food_diary(user_id: int, date_str: str = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if date_str:
        cursor.execute("""
            SELECT * FROM food_diary WHERE user_id = ? AND date = ? ORDER BY created_at ASC
        """, (user_id, date_str))
    else:
        cursor.execute("""
            SELECT * FROM food_diary WHERE user_id = ? ORDER BY date DESC, created_at ASC
        """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def record_hydration_log(user_id: int, date_str: str, amount_ml: int, glasses: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        SELECT id, amount_ml, glasses FROM hydration_logs WHERE user_id = ? AND date = ?
    """, (user_id, date_str))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE hydration_logs
            SET amount_ml = ?, glasses = ?, created_at = ?
            WHERE id = ?
        """, (amount_ml, glasses, now_str, existing["id"]))
    else:
        cursor.execute("""
            INSERT INTO hydration_logs (user_id, date, amount_ml, glasses, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, date_str, amount_ml, glasses, now_str))

    conn.commit()
    conn.close()


def get_user_hydration_logs(user_id: int, limit: int = 14) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM hydration_logs WHERE user_id = ? ORDER BY date DESC LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== REMINDERS HELPERS ====================

def get_user_reminders(user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM reminders WHERE user_id = ? ORDER BY time ASC
    """, (user_id,))
    rows = cursor.fetchall()

    if not rows:
        # Seed default reminders for user if none exist
        seed_default_reminders_for_user(cursor, user_id)
        conn.commit()
        cursor.execute("""
            SELECT * FROM reminders WHERE user_id = ? ORDER BY time ASC
        """, (user_id,))
        rows = cursor.fetchall()

    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["days"] = json.loads(d["days_json"])
        except Exception:
            d["days"] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        result.append(d)
    return result


def seed_default_reminders_for_user(cursor, user_id: int):
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    defaults = [
        ("morning_skincare", "Morning Skincare Routine", "08:00"),
        ("sunscreen_reapplication", "Sunscreen Reapplication Check", "12:30"),
        ("hydration", "Drink Fresh Water (Hydration)", "14:00"),
        ("evening_skincare", "Evening Skincare & Cleansing", "21:30"),
        ("comfort_checkin", "Daily Skin Comfort Check-in", "22:00")
    ]
    for r_type, title, r_time in defaults:
        cursor.execute("""
            INSERT INTO reminders (user_id, reminder_type, title, time, is_enabled, days_json, created_at)
            VALUES (?, ?, ?, ?, 1, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]', ?)
        """, (user_id, r_type, title, r_time, now_str))


def create_or_update_reminder(user_id: int, reminder_data: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    r_id = reminder_data.get("id")
    r_type = reminder_data.get("reminder_type", "general")
    title = reminder_data.get("title", "Daily Reminder")
    r_time = reminder_data.get("time", "08:00")
    enabled = 1 if reminder_data.get("is_enabled", True) else 0
    days_json = json.dumps(reminder_data.get("days", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))

    if r_id:
        cursor.execute("""
            UPDATE reminders
            SET reminder_type = ?, title = ?, time = ?, is_enabled = ?, days_json = ?
            WHERE id = ? AND user_id = ?
        """, (r_type, title, r_time, enabled, days_json, r_id, user_id))
    else:
        cursor.execute("""
            INSERT INTO reminders (user_id, reminder_type, title, time, is_enabled, days_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, r_type, title, r_time, enabled, days_json, now_str))
        r_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return r_id


def delete_user_reminder(user_id: int, reminder_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM reminders WHERE id = ? AND user_id = ?
    """, (reminder_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ==================== PRIVACY & DATA PURGE ====================

def delete_all_user_data(user_id: int) -> Dict[str, Any]:
    """Purges all user records for GDPR/Privacy compliance while leaving user account intact or deleting account."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM routine_plans WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM routine_tasks WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM symptom_checkins WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM food_diary WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM hydration_logs WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM reminders WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"message": "All assessments, routine logs, symptom history, food logs, and reminders purged successfully."}


# ==================== PASSWORD RESET & EMAIL ====================

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def is_smtp_configured() -> bool:
    """Checks whether SMTP environment variables are properly configured."""
    server = os.environ.get("SMTP_SERVER") or os.environ.get("SMTP_HOST")
    user = os.environ.get("SMTP_USERNAME") or os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    return bool(server and user and password)


def send_password_reset_email(to_email: str, reset_code: str) -> tuple[bool, str]:
    """Sends one-time verification code via configured SMTP service."""
    if not is_smtp_configured():
        return False, "SMTP_NOT_CONFIGURED"

    server_host = os.environ.get("SMTP_SERVER") or os.environ.get("SMTP_HOST")
    port_str = os.environ.get("SMTP_PORT", "587")
    try:
        port = int(port_str)
    except ValueError:
        port = 587
    user = os.environ.get("SMTP_USERNAME") or os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    from_email = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_FROM") or user

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Verification Code - Skin Care Expert System"
        msg["From"] = from_email
        msg["To"] = to_email

        text_body = f"""Hello,

You requested a password reset for your Skin Care Expert System account.

Your 6-digit one-time verification code is: {reset_code}

This code will expire in 10 minutes. If you did not make this request, please disregard this email.
"""
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #E8E2D8; border-radius: 12px; background-color: #FAF8F5;">
            <h2 style="color: #2D6A4F; margin-bottom: 8px;">Skin Care Expert System</h2>
            <p style="color: #536258; font-size: 15px;">You requested a password reset for your account.</p>
            <div style="background-color: #FFFFFF; border: 1.5px solid #2D6A4F; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #14241B;">{reset_code}</span>
            </div>
            <p style="color: #79877E; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
        """
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(server_host, port, timeout=12) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
        return True, "Email sent successfully."
    except Exception as e:
        return False, f"Email delivery failed: {str(e)}"


def create_password_reset(email: str, user_id: int, reset_code: str, expires_in_minutes: int = 10) -> bool:
    """Stores a temporary 6-digit password reset code with a strict 10-minute expiry."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_utc = datetime.now(timezone.utc)
    expires_at = (now_utc + timedelta(minutes=expires_in_minutes)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now_utc.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO password_resets (user_id, email, reset_code, expires_at, attempts, used, created_at)
        VALUES (?, ?, ?, ?, 0, 0, ?)
    """, (user_id, email, reset_code, expires_at, now_str))
    conn.commit()
    conn.close()
    return True


def verify_password_reset_code(email: str, reset_code: str) -> tuple[bool, str]:
    """Verifies a reset code without updating the password, checking expiry and attempt limits."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, reset_code, expires_at, used, attempts FROM password_resets
        WHERE email = ? AND used = 0
        ORDER BY id DESC LIMIT 1
    """, (email,))
    record = cursor.fetchone()

    if not record:
        conn.close()
        return False, "Invalid or expired verification code."

    if record["attempts"] >= 5:
        conn.close()
        return False, "Too many incorrect attempts. Please request a new verification code."

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if record["expires_at"] < now_str:
        conn.close()
        return False, "This verification code has expired (10-minute limit). Please request a new code."

    if record["reset_code"] != reset_code.strip():
        cursor.execute("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?", (record["id"],))
        conn.commit()
        conn.close()
        remaining = 5 - (record["attempts"] + 1)
        return False, f"Incorrect verification code. {remaining} attempt(s) remaining."

    conn.close()
    return True, "Verification code is valid."


def reset_user_password(email: str, reset_code: str, new_password: str) -> tuple[bool, str]:
    """Validates reset code and updates user's password, invalidating old sessions."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        return False, "Account not found."

    cursor.execute("""
        SELECT id, reset_code, expires_at, used, attempts FROM password_resets
        WHERE email = ? AND used = 0
        ORDER BY id DESC LIMIT 1
    """, (email,))
    reset_record = cursor.fetchone()

    if not reset_record:
        conn.close()
        return False, "Invalid or expired verification code."

    if reset_record["attempts"] >= 5:
        conn.close()
        return False, "Too many incorrect attempts. Please request a new verification code."

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if reset_record["expires_at"] < now_str:
        conn.close()
        return False, "This verification code has expired. Please request a new one."

    if reset_record["reset_code"] != reset_code.strip():
        cursor.execute("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?", (reset_record["id"],))
        conn.commit()
        conn.close()
        return False, "Incorrect verification code."

    # Mark code as used
    cursor.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset_record["id"],))

    # Update user password hash
    new_hash = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_row["id"]))

    # Invalidate all prior auth tokens
    cursor.execute("DELETE FROM auth_tokens WHERE user_id = ?", (user_row["id"],))

    conn.commit()
    conn.close()
    return True, "Password has been successfully updated. You can now log in."


def delete_user_assessment(user_id: int, assessment_id: int) -> bool:
    """Deletes a single assessment record for the authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE id = ? AND user_id = ?", (assessment_id, user_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected


def get_user_profile_stats(user_id: int) -> Dict[str, Any]:
    """Computes actual counts for user profile without fabricating statistics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM assessments WHERE user_id = ?", (user_id,))
    total_assessments = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM routine_tasks WHERE user_id = ? AND status = 'completed'", (user_id,))
    total_routine_steps = cursor.fetchone()["count"]
    conn.close()
    return {
        "total_assessments": total_assessments,
        "total_routine_steps": total_routine_steps
    }

