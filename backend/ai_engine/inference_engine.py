"""
Forward-Chaining Inference Engine for AI Skin Care Expert System.
Implements classical symbolic forward chaining with working memory,
agenda management, conflict resolution by priority, multi-pass cycles until quiescence,
and rigorous execution tracing.
"""

from typing import Dict, Any, List
import copy
from .fuzzy_logic import SkinFuzzyClassifier
from .knowledge_base import build_knowledge_base, Rule


class InferenceEngine:
    def __init__(self, rules: List[Rule] = None):
        self.rules = rules or build_knowledge_base()

    def run(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes forward chaining on raw input facts.
        Returns complete inference result including derived facts, fired rules,
        explanation trace, and recommendations.
        """
        # Step 1: Pre-process and assert Initial Working Memory Facts
        working_memory = self._initialize_working_memory(raw_input)

        # Step 2: Multi-pass Forward-Chaining Loop
        fired_rules: List[Dict[str, Any]] = []
        unfired_rules: List[Dict[str, Any]] = []
        execution_trace: List[Dict[str, Any]] = []
        suppressed_tags: set = set()

        already_fired_ids = set()
        cycle = 1
        max_cycles = 10  # Quiescence guarantee

        while cycle <= max_cycles:
            cycle_fired_any = False
            agenda = []

            for rule in self.rules:
                if rule.rule_id in already_fired_ids:
                    continue

                eval_result = rule.evaluate(working_memory)
                if eval_result.get("fired", False):
                    agenda.append((rule, eval_result))
                else:
                    # Keep track of why rule didn't fire in the final trace
                    if cycle == 1:
                        unfired_rules.append({
                            "rule_id": rule.rule_id,
                            "name": rule.name,
                            "category": rule.category,
                            "priority": rule.priority,
                            "conditions_summary": rule.conditions_summary,
                            "details": eval_result.get("details", []),
                            "reason": "One or more antecedent conditions were not satisfied."
                        })

            # Conflict Resolution: Sort agenda by rule priority DESC, then activation strength DESC
            agenda.sort(
                key=lambda item: (item[0].priority, item[1].get("activation_strength", 0.0)),
                reverse=True
            )

            # Fire rules in agenda for this cycle
            for rule, eval_result in agenda:
                already_fired_ids.add(rule.rule_id)
                cycle_fired_any = True

                # Assert consequents into working memory
                for k, v in rule.consequents_dict.items():
                    working_memory["derived_facts"][k] = v

                # Register suppressions
                for supp in rule.suppressions:
                    suppressed_tags.add(supp)

                trace_entry = {
                    "cycle": cycle,
                    "rule_id": rule.rule_id,
                    "name": rule.name,
                    "category": rule.category,
                    "priority": rule.priority,
                    "conditions_summary": rule.conditions_summary,
                    "activation_strength": eval_result.get("activation_strength", 1.0),
                    "details": eval_result.get("details", []),
                    "consequents": rule.consequents_dict,
                    "faculty_rationale": rule.faculty_rationale,
                    "description": rule.description
                }

                execution_trace.append(trace_entry)
                fired_rules.append({
                    "rule_id": rule.rule_id,
                    "name": rule.name,
                    "category": rule.category,
                    "priority": rule.priority,
                    "conditions_summary": rule.conditions_summary,
                    "description": rule.description,
                    "activation_strength": eval_result.get("activation_strength", 1.0),
                    "details": eval_result.get("details", []),
                    "consequents": rule.consequents_dict,
                    "recommendations": rule.recommendations,
                    "faculty_rationale": rule.faculty_rationale
                })

            if not cycle_fired_any:
                # Quiescence reached: no more rules can fire
                break
            cycle += 1

        # Step 3: Consolidate Recommendations and apply Rule Suppressions
        final_recommendations = []
        is_recovery_active = working_memory["derived_facts"].get("recovery_mode") == "ACTIVE"

        for fired in fired_rules:
            for rec in fired["recommendations"]:
                # Check if recommendation tag is suppressed (e.g. R08 suppresses harsh actives)
                rec_tag = rec.get("tag", "").upper()
                if is_recovery_active and any(supp in rec_tag for supp in ["EXFOLIAT", "BHA", "ACID", "RETINOID", "ACTIVE"]):
                    continue
                final_recommendations.append({
                    **rec,
                    "source_rule_id": fired["rule_id"],
                    "source_rule_name": fired["name"]
                })

        # Step 4: Compute Overall Skin State & Barrier Index
        operating_mode = "RECOVERY_MODE" if is_recovery_active else "NORMAL"
        barrier_index = self._calculate_barrier_health_index(working_memory)
        primary_skin_state = self._determine_primary_skin_state(working_memory)

        return {
            "initial_facts": {
                "hydration": working_memory.get("hydration"),
                "oiliness": working_memory.get("oiliness"),
                "sensitivity": working_memory.get("sensitivity"),
                "redness": working_memory.get("redness"),
                "acne_concern": working_memory.get("acne_concern"),
                "dryness": working_memory.get("dryness"),
                "irritation": working_memory.get("irritation"),
                "barrier_concern": working_memory.get("barrier_concern"),
                "temperature": working_memory.get("temperature"),
                "humidity": working_memory.get("humidity"),
                "uv_index": working_memory.get("uv_index"),
                "sleep_hours": working_memory.get("sleep_hours"),
                "outdoor_hours": working_memory.get("outdoor_hours"),
                "symptoms": working_memory.get("symptoms"),
                "completeness_ratio": working_memory.get("completeness_ratio")
            },
            "fuzzy_classifications": {
                "hydration": working_memory.get("hydration_fuzzy"),
                "oiliness": working_memory.get("oiliness_fuzzy"),
                "sensitivity": working_memory.get("sensitivity_fuzzy"),
                "redness": working_memory.get("redness_fuzzy"),
                "acne_concern": working_memory.get("acne_fuzzy"),
                "dryness": working_memory.get("dryness_fuzzy"),
                "irritation": working_memory.get("irritation_fuzzy"),
                "uv_index": working_memory.get("uv_fuzzy"),
                "humidity": working_memory.get("humidity_fuzzy")
            },
            "derived_facts": working_memory["derived_facts"],
            "operating_mode": operating_mode,
            "barrier_health_index": barrier_index,
            "primary_skin_state": primary_skin_state,
            "fired_rules": fired_rules,
            "unfired_rules": unfired_rules,
            "execution_trace": execution_trace,
            "recommendations": final_recommendations,
            "professional_alert": working_memory["derived_facts"].get("professional_evaluation_alert", False),
            "cycles_to_quiescence": cycle - 1
        }

    def _initialize_working_memory(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """Asserts raw facts and performs fuzzy fuzzification."""
        wm: Dict[str, Any] = copy.deepcopy(raw_input)

        # Baseline quantitative skin values
        wm["hydration"] = float(raw_input.get("hydration", 50))
        wm["oiliness"] = float(raw_input.get("oiliness", 50))
        wm["sensitivity"] = float(raw_input.get("sensitivity", 20))
        wm["redness"] = float(raw_input.get("redness", 20))
        wm["acne_concern"] = float(raw_input.get("acne_concern", 20))
        wm["dryness"] = float(raw_input.get("dryness", 30))
        wm["irritation"] = float(raw_input.get("irritation", 20))
        wm["barrier_concern"] = float(raw_input.get("barrier_concern", 20))

        # Environmental
        wm["temperature"] = float(raw_input.get("temperature", 24))
        wm["humidity"] = float(raw_input.get("humidity", 50))
        wm["uv_index"] = float(raw_input.get("uv_index", 3))

        # Lifestyle & Symptoms
        wm["sleep_hours"] = float(raw_input.get("sleep_hours", 7.5))
        wm["outdoor_hours"] = float(raw_input.get("outdoor_hours", 2.0))
        wm["newly_introduced_products"] = bool(raw_input.get("newly_introduced_products", False))
        wm["symptoms"] = raw_input.get("symptoms", {})

        # Compute Assessment Completeness Ratio
        completeness = self._compute_completeness(raw_input)
        wm["completeness_ratio"] = completeness

        # Apply Fuzzy Classifications
        wm["hydration_fuzzy"] = SkinFuzzyClassifier.classify_hydration(wm["hydration"])
        wm["oiliness_fuzzy"] = SkinFuzzyClassifier.classify_oiliness(wm["oiliness"])
        wm["sensitivity_fuzzy"] = SkinFuzzyClassifier.classify_sensitivity(wm["sensitivity"])
        wm["redness_fuzzy"] = SkinFuzzyClassifier.classify_redness(wm["redness"])
        wm["acne_fuzzy"] = SkinFuzzyClassifier.classify_acne_concern(wm["acne_concern"])
        wm["dryness_fuzzy"] = SkinFuzzyClassifier.classify_dryness(wm["dryness"])
        wm["irritation_fuzzy"] = SkinFuzzyClassifier.classify_irritation(wm["irritation"])
        wm["uv_fuzzy"] = SkinFuzzyClassifier.classify_uv_index(wm["uv_index"])
        wm["humidity_fuzzy"] = SkinFuzzyClassifier.classify_humidity(wm["humidity"])

        wm["derived_facts"] = {}
        return wm

    def _compute_completeness(self, raw_input: Dict[str, Any]) -> float:
        """Determines ratio of provided fields out of full assessment schema."""
        expected_keys = [
            "hydration", "oiliness", "sensitivity", "redness", "acne_concern",
            "dryness", "irritation", "barrier_concern", "temperature",
            "humidity", "uv_index", "sleep_hours", "outdoor_hours"
        ]
        present = 0
        for k in expected_keys:
            if k in raw_input and raw_input[k] is not None:
                present += 1
        return round(present / len(expected_keys), 2)

    def _calculate_barrier_health_index(self, wm: Dict[str, Any]) -> int:
        """
        Calculates a deterministic 0-100 barrier health index based on
        corneometric facts: positive contributors (hydration) vs negative
        stressors (irritation, sensitivity, redness, dryness).
        """
        hyd = wm.get("hydration", 50)
        sen = wm.get("sensitivity", 20)
        red = wm.get("redness", 20)
        dry = wm.get("dryness", 20)
        irr = wm.get("irritation", 20)

        # Baseline equation: High hydration + Low (stressors)
        score = (hyd * 0.40) + ((100 - sen) * 0.20) + ((100 - red) * 0.15) + ((100 - dry) * 0.15) + ((100 - irr) * 0.10)

        # If recovery mode is active or barrier rule fired, deduct penalty
        if wm.get("derived_facts", {}).get("recovery_mode") == "ACTIVE":
            score -= 20
        elif wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED":
            score -= 10

        return max(5, min(98, int(round(score))))

    def _determine_primary_skin_state(self, wm: Dict[str, Any]) -> str:
        """Derives primary clinical label for the user's Skin Twin."""
        derived = wm.get("derived_facts", {})
        if derived.get("recovery_mode") == "ACTIVE":
            return "Acute Barrier Stress (Recovery Mode Active)"
        if derived.get("derived_state") == "OILY_WITH_LOW_HYDRATION":
            return "Dehydrated Oily Skin Complex"
        if derived.get("dryness_concern") == "ELEVATED":
            return "Alipic Dry / Xerotic Barrier"
        if derived.get("comedonal_congestion_risk") == "ELEVATED":
            return "Sebum Congested / Blemish-Prone"
        if derived.get("irritation_concern") == "ELEVATED":
            return "Reactive Erythematous Skin"
        if derived.get("skin_barrier_status") == "OPTIMAL_HOMEOSTASIS":
            return "Balanced Epidermal Homeostasis"

        # Fallback to dominant fuzzy terms
        oil_dom = wm.get("oiliness_fuzzy", {}).get("dominant", "MEDIUM")
        hyd_dom = wm.get("hydration_fuzzy", {}).get("dominant", "MEDIUM")
        return f"{oil_dom.capitalize()} Sebum / {hyd_dom.capitalize()} Hydration Archetype"
