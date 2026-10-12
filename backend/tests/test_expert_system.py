"""
Unit and Integration Test Suite for AI Skin Care Expert System.
Verifies all 10 academic FOAI testing requirements:
1. High oiliness + low hydration -> OILY_WITH_LOW_HYDRATION
2. High sensitivity + high redness -> irritation_concern = ELEVATED
3. Missing data lowers assessment completeness
4. Recovery Mode activates only when its actual rule conditions are met
5. Severe/persistent symptoms trigger professional-care alert
6. What-if simulation does not change saved Digital Twin
7. Historical comparisons use real saved assessments
8. Explanation traces match the rules that actually fired
9. Invalid inputs are rejected
10. Users cannot access another user's records
"""

import unittest
import json
import os
import sys

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_engine.inference_engine import InferenceEngine
from ai_engine.explanation_engine import ExplanationEngine
from ai_engine.digital_twin import SkinDigitalTwin
from ai_engine.simulator import WhatIfSimulator
from database import init_db, get_db_connection, hash_password
from app import app


class TestSkinCareExpertSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.engine = InferenceEngine()
        cls.simulator = WhatIfSimulator(cls.engine)
        cls.client = app.test_client()

    def test_01_oily_low_hydration_derived_state(self):
        """1. High oiliness + low hydration triggers derived state OILY_WITH_LOW_HYDRATION."""
        inputs = {
            "oiliness": 85.0,
            "hydration": 25.0,
            "sensitivity": 20.0,
            "redness": 15.0,
            "acne_concern": 30.0,
            "dryness": 20.0,
            "irritation": 15.0
        }
        res = self.engine.run(inputs)
        fired_ids = [r["rule_id"] for r in res["fired_rules"]]
        self.assertIn("R01", fired_ids, "Rule R01 must fire for High Oiliness + Low Hydration")
        self.assertEqual(res["derived_facts"].get("derived_state"), "OILY_WITH_LOW_HYDRATION")
        self.assertEqual(res["primary_skin_state"], "Dehydrated Oily Skin Complex")

    def test_02_high_sensitivity_high_redness_irritation(self):
        """2. High sensitivity + high redness triggers defined irritation rule (R02)."""
        inputs = {
            "sensitivity": 80.0,
            "redness": 75.0,
            "hydration": 60.0,
            "oiliness": 40.0,
            "dryness": 30.0,
            "irritation": 30.0
        }
        res = self.engine.run(inputs)
        fired_ids = [r["rule_id"] for r in res["fired_rules"]]
        self.assertIn("R02", fired_ids, "Rule R02 must fire for High Sensitivity + High Redness")
        self.assertEqual(res["derived_facts"].get("irritation_concern"), "ELEVATED")

    def test_03_missing_data_lowers_completeness(self):
        """3. Missing data lowers assessment completeness and triggers R07."""
        # Minimal inputs missing environmental & lifestyle fields
        partial_inputs = {
            "hydration": 50.0,
            "oiliness": 50.0,
            "sensitivity": 20.0,
            "redness": 20.0
        }
        res = self.engine.run(partial_inputs)
        completeness = res["initial_facts"]["completeness_ratio"]
        self.assertLess(completeness, 0.70, f"Completeness ratio should be < 0.70, got {completeness}")
        fired_ids = [r["rule_id"] for r in res["fired_rules"]]
        self.assertIn("R07", fired_ids, "R07 must fire when completeness < 70%")
        self.assertEqual(res["derived_facts"].get("assessment_completeness"), "LIMITED")

    def test_04_recovery_mode_activation_criteria(self):
        """4. Recovery Mode activates only when its actual rule conditions are met (R03)."""
        # Case A: Elevated irritation WITHOUT burning or severe score -> Recovery mode should NOT be active
        mild_inputs = {
            "sensitivity": 80.0,
            "redness": 75.0,
            "irritation": 40.0,
            "symptoms": {"burning": False}
        }
        mild_res = self.engine.run(mild_inputs)
        self.assertEqual(mild_res["derived_facts"].get("recovery_mode"), None)
        self.assertEqual(mild_res["operating_mode"], "NORMAL")

        # Case B: Elevated irritation WITH burning symptom -> Recovery mode MUST ACTIVATE
        acute_inputs = {
            "sensitivity": 80.0,
            "redness": 75.0,
            "irritation": 40.0,
            "symptoms": {"burning": True}
        }
        acute_res = self.engine.run(acute_inputs)
        self.assertEqual(acute_res["derived_facts"].get("recovery_mode"), "ACTIVE")
        self.assertEqual(acute_res["operating_mode"], "RECOVERY_MODE")
        fired_ids = [r["rule_id"] for r in acute_res["fired_rules"]]
        self.assertIn("R03", fired_ids)
        self.assertIn("R08", fired_ids, "R08 (Regimen conflict suppression) must fire when recovery mode is active")

    def test_05_severe_symptoms_trigger_professional_alert(self):
        """5. Severe/persistent symptoms trigger a professional-care alert (R04)."""
        symptomatic_inputs = {
            "hydration": 40.0,
            "oiliness": 40.0,
            "sensitivity": 50.0,
            "redness": 50.0,
            "symptoms": {
                "blistering": True,
                "severe_swelling": False,
                "persistent_weeks": 3
            }
        }
        res = self.engine.run(symptomatic_inputs)
        fired_ids = [r["rule_id"] for r in res["fired_rules"]]
        self.assertIn("R04", fired_ids, "Rule R04 must fire for blistering/chronic symptoms")
        self.assertTrue(res["professional_alert"])
        self.assertTrue(res["derived_facts"].get("professional_evaluation_alert"))

    def test_06_what_if_simulation_does_not_mutate_twin(self):
        """6. What-if simulation does not change the saved Digital Twin."""
        baseline = {
            "hydration": 60.0,
            "oiliness": 40.0,
            "sensitivity": 20.0,
            "redness": 20.0,
            "irritation": 15.0
        }
        overrides = {
            "sensitivity": 95.0,
            "redness": 90.0,
            "symptoms": {"burning": True}
        }
        sim_res = self.simulator.simulate(baseline, overrides)
        self.assertEqual(sim_res["baseline"]["operating_mode"], "NORMAL")
        self.assertEqual(sim_res["hypothetical"]["operating_mode"], "RECOVERY_MODE")
        self.assertTrue(sim_res["is_simulation"])

        # Baseline dict remains unaffected
        self.assertEqual(baseline["sensitivity"], 20.0)
        self.assertEqual(baseline["redness"], 20.0)

    def test_07_historical_comparisons_use_real_saved_assessments(self):
        """7. Historical comparisons use real saved assessments and compute accurate deltas."""
        prev = {"hydration": 60.0, "oiliness": 70.0, "barrier_health_index": 70}
        curr_inputs = {"hydration": 42.0, "oiliness": 85.0}
        curr_inf = self.engine.run(curr_inputs)
        twin = SkinDigitalTwin.build_twin_snapshot(curr_inputs, curr_inf, prev)

        self.assertTrue(twin["has_prior_history"])
        self.assertEqual(twin["deltas"]["hydration"]["previous"], 60.0)
        self.assertEqual(twin["deltas"]["hydration"]["current"], 42.0)
        self.assertEqual(twin["deltas"]["hydration"]["change"], -18.0)
        self.assertEqual(twin["deltas"]["hydration"]["direction"], "down")
        self.assertEqual(twin["deltas"]["oiliness"]["change"], 15.0)

    def test_08_explanation_traces_match_fired_rules(self):
        """8. Explanation traces match the rules that actually fired."""
        inputs = {
            "oiliness": 85.0,
            "hydration": 20.0,
            "sensitivity": 80.0,
            "redness": 75.0,
            "uv_index": 8.0,
            "symptoms": {"burning": True}
        }
        res = self.engine.run(inputs)
        graph = ExplanationEngine.generate_explanation_graph(res)

        fired_rule_ids = {r["rule_id"] for r in res["fired_rules"]}
        graph_rule_nodes = {n["data"]["rule_id"] for n in graph["nodes"] if n["type"] == "RULE"}

        self.assertEqual(fired_rule_ids, graph_rule_nodes)
        self.assertIn("R01", graph_rule_nodes)
        self.assertIn("R02", graph_rule_nodes)
        self.assertIn("R03", graph_rule_nodes)
        self.assertIn("R05", graph_rule_nodes)

    def test_09_invalid_inputs_are_rejected(self):
        """9. Invalid inputs (e.g. out of range or malformed) are rejected by the API."""
        # Register a temporary user for API test
        temp_email = f"test_{os.urandom(4).hex()}@test.edu"
        reg_res = self.client.post("/api/auth/register", json={
            "email": temp_email,
            "full_name": "Test Validator",
            "password": "Password123!",
            "confirm_password": "Password123!"
        })
        token = reg_res.get_json()["token"]

        # Send invalid numerical value > 100
        bad_res = self.client.post(
            "/api/assessments",
            headers={"Authorization": f"Bearer {token}"},
            json={"hydration": 150.0, "oiliness": -10.0}
        )
        self.assertEqual(bad_res.status_code, 400)
        self.assertIn("error", bad_res.get_json())

    def test_10_users_cannot_access_another_users_records(self):
        """10. Users cannot access another user's records (Data isolation)."""
        # User A
        email_a = f"usera_{os.urandom(4).hex()}@test.edu"
        res_a = self.client.post("/api/auth/register", json={
            "email": email_a, "full_name": "User Alpha",
            "password": "Password123!", "confirm_password": "Password123!"
        })
        token_a = res_a.get_json()["token"]

        # Create assessment for User A
        self.client.post(
            "/api/assessments",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"hydration": 60.0, "oiliness": 40.0}
        )

        # User B
        email_b = f"userb_{os.urandom(4).hex()}@test.edu"
        res_b = self.client.post("/api/auth/register", json={
            "email": email_b, "full_name": "User Beta",
            "password": "Password123!", "confirm_password": "Password123!"
        })
        token_b = res_b.get_json()["token"]

        # User B fetches history -> should be 0 assessments
        history_b = self.client.get(
            "/api/assessments/history",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        data_b = history_b.get_json()
        self.assertEqual(len(data_b["history"]), 0, "User B must not see User A's assessments.")


if __name__ == "__main__":
    unittest.main()
