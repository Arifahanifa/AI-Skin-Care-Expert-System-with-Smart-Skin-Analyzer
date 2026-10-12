"""
What-If Scenario Simulator for AI Skin Care Expert System.
Enables non-destructive rule-based simulation of hypothetical skin states,
identifies newly fired or deactivated rules, and analyzes decision sensitivity.
"""

from typing import Dict, Any
import copy
from .inference_engine import InferenceEngine


class WhatIfSimulator:
    def __init__(self, inference_engine: InferenceEngine = None):
        self.engine = inference_engine or InferenceEngine()

    def simulate(
        self,
        baseline_inputs: Dict[str, Any],
        hypothetical_overrides: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes comparative simulation between baseline observations and hypothetical conditions.
        Completely non-destructive and strictly memory-resident.
        """
        # Run inference on baseline
        base_res = self.engine.run(baseline_inputs)

        # Merge hypothetical values over baseline
        hypo_inputs = copy.deepcopy(baseline_inputs)
        for k, v in hypothetical_overrides.items():
            if v is not None:
                hypo_inputs[k] = v

        # Run inference on hypothetical state
        hypo_res = self.engine.run(hypo_inputs)

        # Compute Rule Discrepancies
        base_fired_ids = {r["rule_id"]: r for r in base_res.get("fired_rules", [])}
        hypo_fired_ids = {r["rule_id"]: r for r in hypo_res.get("fired_rules", [])}

        newly_activated = [
            hypo_fired_ids[rid]
            for rid in hypo_fired_ids
            if rid not in base_fired_ids
        ]

        deactivated = [
            base_fired_ids[rid]
            for rid in base_fired_ids
            if rid not in hypo_fired_ids
        ]

        # Metric comparison vector
        compared_metrics = {}
        target_keys = ["hydration", "oiliness", "sensitivity", "redness", "acne_concern", "dryness", "irritation", "uv_index", "humidity"]
        for k in target_keys:
            b_val = float(baseline_inputs.get(k, 0))
            h_val = float(hypo_inputs.get(k, 0))
            compared_metrics[k] = {
                "baseline": b_val,
                "hypothetical": h_val,
                "difference": round(h_val - b_val, 1)
            }

        return {
            "is_simulation": True,
            "academic_disclaimer": "Rule-Based Scenario Simulation (Purely symbolic inference; not a medical or biological prediction).",
            "baseline": {
                "barrier_health_index": base_res["barrier_health_index"],
                "operating_mode": base_res["operating_mode"],
                "primary_skin_state": base_res["primary_skin_state"],
                "fired_rule_count": len(base_res["fired_rules"])
            },
            "hypothetical": {
                "barrier_health_index": hypo_res["barrier_health_index"],
                "operating_mode": hypo_res["operating_mode"],
                "primary_skin_state": hypo_res["primary_skin_state"],
                "fired_rule_count": len(hypo_res["fired_rules"]),
                "fired_rules": hypo_res["fired_rules"],
                "recommendations": hypo_res["recommendations"]
            },
            "metric_comparisons": compared_metrics,
            "newly_activated_rules": newly_activated,
            "deactivated_rules": deactivated,
            "mode_transition": {
                "from_mode": base_res["operating_mode"],
                "to_mode": hypo_res["operating_mode"],
                "changed": base_res["operating_mode"] != hypo_res["operating_mode"]
            },
            "barrier_index_change": round(hypo_res["barrier_health_index"] - base_res["barrier_health_index"], 1)
        }
