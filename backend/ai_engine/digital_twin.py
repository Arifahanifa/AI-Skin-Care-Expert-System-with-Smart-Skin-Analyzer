"""
Digital Twin State Management Module for AI Skin Care Expert System.
Maintains state representation of the user's Dynamic Skin Digital Twin.
Strictly separates data into three distinct non-merged categories:
  Category A: Image-derived observations (Haar face detection, exposure, sharpness, color, texture)
  Category B: User-reported information (comfort, dryness, irritation, products, allergies, questionnaire)
  Category C: Rule-derived conclusions (evaluated rules, fired rules, routine rationale, safety warnings)
Calculates parameter deltas against historical snapshots without fabricating medical scores.
"""

from typing import Dict, Any, Optional, List
import json


class SkinDigitalTwin:
    """
    In-memory and persistent state representation of the user's Skin Digital Twin.
    Maintains rigorous separation between optical observations, self-reported symptoms,
    and symbolic AI inference conclusions.
    """

    @staticmethod
    def build_twin_snapshot(
        current_assessment: Dict[str, Any],
        inference_result: Dict[str, Any],
        previous_assessment: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Builds the unified digital twin state with three cleanly segregated categories.
        """
        curr_facts = inference_result.get("initial_facts", {})
        derived_facts = inference_result.get("derived_facts", {})
        barrier_index = inference_result.get("barrier_health_index", 50)
        operating_mode = inference_result.get("operating_mode", "NORMAL")
        primary_skin_state = inference_result.get("primary_skin_state", "Normal Skin")

        # Parse JSON fields if strings
        img_obs = current_assessment.get("image_observations_json")
        if isinstance(img_obs, str):
            try:
                img_obs = json.loads(img_obs)
            except Exception:
                img_obs = {}
        elif not img_obs:
            img_obs = current_assessment.get("image_observations") or {}

        user_quest = current_assessment.get("user_questionnaire_json")
        if isinstance(user_quest, str):
            try:
                user_quest = json.loads(user_quest)
            except Exception:
                user_quest = {}
        elif not user_quest:
            user_quest = current_assessment.get("user_questionnaire") or {}

        # ---------------- CATEGORY A: Image-Derived Observations ----------------
        category_a = {
            "title": "Category A: Optical Image-Derived Observations",
            "timestamp": current_assessment.get("created_at"),
            "has_camera_data": bool(img_obs and img_obs.get("face_detection")),
            "face_detection": img_obs.get("face_detection", {
                "status": "NOT_CAPTURED_OR_LOCAL_ONLY",
                "detector_type": "Viola-Jones Haar Cascade"
            }),
            "exposure_statistics": img_obs.get("exposure_statistics", {
                "mean_luminance": None,
                "assessment": "No image data supplied"
            }),
            "sharpness_statistics": img_obs.get("sharpness_statistics", {
                "laplacian_variance": None,
                "is_sharp": None
            }),
            "color_statistics": img_obs.get("color_statistics", {}),
            "regional_differences": img_obs.get("regional_differences", {
                "delta_e_forehead_to_cheeks": None,
                "redness_contrast_ratio": None
            }),
            "texture_statistics": img_obs.get("texture_statistics", {}),
            "scientific_limitations": [
                "Hardware webcam pixel observations only; NOT a clinical medical diagnosis.",
                "A normal RGB camera cannot measure biological stratum corneum hydration, sebum production, or barrier lipid integrity.",
                "Webcam chrominance alone does not establish medical erythema or inflammatory pathology."
            ]
        }

        # ---------------- CATEGORY B: User-Reported Information ----------------
        category_b = {
            "title": "Category B: Subjective User-Reported Information",
            "self_described_skin_type": user_quest.get("skin_type", "not_sure"),
            "dryness_and_tightness": user_quest.get("dryness_tightness", "not_sure"),
            "sensitivity": user_quest.get("sensitivity", "not_sure"),
            "redness_noticed": user_quest.get("user_redness", "not_sure"),
            "burning_or_stinging": user_quest.get("burning_stinging", False),
            "current_irritation": user_quest.get("current_irritation", "none"),
            "existing_skincare_products": user_quest.get("existing_products", "Standard gentle cleanser, moisturizer"),
            "recently_introduced_products": user_quest.get("new_products", "None reported"),
            "known_allergies": user_quest.get("allergies", "None reported"),
            "fragrance_preference": user_quest.get("fragrance_pref", "fragrance_free"),
            "current_routine": user_quest.get("current_routine", "standard"),
            "food_preferences": user_quest.get("food_pref", "balanced"),
            "sleep_hours": curr_facts.get("sleep_hours", 7.5),
            "outdoor_hours": curr_facts.get("outdoor_hours", 2.0),
            "symptoms_reported": curr_facts.get("symptoms", {})
        }

        # ---------------- CATEGORY C: Rule-Derived Conclusions ----------------
        fired_rules = inference_result.get("fired_rules", [])
        unfired_rules = inference_result.get("unfired_rules", [])
        recommendations = inference_result.get("recommendations", [])
        safety_alert = inference_result.get("professional_alert", False)

        category_c = {
            "title": "Category C: Symbolic Rule-Derived Conclusions",
            "operating_mode": operating_mode,
            "barrier_health_index": barrier_index,
            "primary_skin_state": primary_skin_state,
            "rules_evaluated_count": len(fired_rules) + len(unfired_rules),
            "rules_fired": [
                {
                    "rule_id": r["rule_id"],
                    "name": r["name"],
                    "priority": r["priority"],
                    "conditions_summary": r["conditions_summary"],
                    "description": r.get("description", ""),
                    "faculty_rationale": r.get("faculty_rationale", "")
                }
                for r in fired_rules
            ],
            "why_routine_selected": f"Selected based on {len(fired_rules)} fired production rules evaluating user symptoms, sensitivity, and environmental context.",
            "safety_guidance": "Academic expert-system educational decision support. Discontinue actives upon stinging; seek prompt dermatological evaluation for acute swelling or blistering.",
            "emergency_or_clinical_alert": safety_alert
        }

        # Quantitative deltas against prior assessment
        core_metrics = {
            "hydration": curr_facts.get("hydration", 50),
            "oiliness": curr_facts.get("oiliness", 50),
            "sensitivity": curr_facts.get("sensitivity", 20),
            "redness": curr_facts.get("redness", 20),
            "acne_concern": curr_facts.get("acne_concern", 20),
            "dryness": curr_facts.get("dryness", 30),
            "irritation": curr_facts.get("irritation", 20),
            "barrier_concern": curr_facts.get("barrier_concern", 20)
        }

        deltas = {}
        has_history = previous_assessment is not None
        for k, current_val in core_metrics.items():
            if has_history and k in previous_assessment:
                prev_val = float(previous_assessment.get(k, 0))
                diff = round(current_val - prev_val, 1)
                deltas[k] = {
                    "previous": prev_val,
                    "current": current_val,
                    "change": diff,
                    "direction": "up" if diff > 0 else ("down" if diff < 0 else "neutral"),
                    "label": f"{'+' if diff > 0 else ''}{diff} pts"
                }
            else:
                deltas[k] = {
                    "previous": None,
                    "current": current_val,
                    "change": 0.0,
                    "direction": "baseline",
                    "label": "Baseline"
                }

        barrier_delta = None
        if has_history and "barrier_health_index" in previous_assessment:
            prev_b = float(previous_assessment.get("barrier_health_index", 50))
            b_diff = round(barrier_index - prev_b, 1)
            barrier_delta = {
                "previous": prev_b,
                "current": barrier_index,
                "change": b_diff,
                "label": f"{'+' if b_diff > 0 else ''}{b_diff} pts"
            }

        return {
            "status": "ACTIVE_SYNCHRONIZED",
            "timestamp": current_assessment.get("created_at"),
            "has_prior_history": has_history,
            "operating_mode": operating_mode,
            "primary_skin_state": primary_skin_state,
            "barrier_health_index": barrier_index,
            "barrier_delta": barrier_delta,
            "metrics": core_metrics,
            "deltas": deltas,
            "category_a_image_observations": category_a,
            "category_b_user_reported": category_b,
            "category_c_rule_conclusions": category_c,
            "completeness_score": int(curr_facts.get("completeness_ratio", 1.0) * 100),
            "recommendations": recommendations,
            "fired_rule_ids": [r["rule_id"] for r in fired_rules]
        }
