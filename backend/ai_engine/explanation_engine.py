"""
Explanation Engine for AI Skin Care Expert System.
Transforms the inference engine's execution trace and working memory into a
graph representation (nodes and edges) for Explainable AI (XAI) visualization,
alongside formal FOAI academic reasoning logs.
"""

from typing import Dict, Any, List


class ExplanationEngine:
    @staticmethod
    def generate_explanation_graph(inference_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Builds a directed acyclic reasoning graph with nodes and directed edges
        representing the causal path:
        Raw Facts -> Fuzzy Membership -> Rules Evaluated/Fired -> Derived Facts -> Recommendations
        """
        nodes = []
        edges = []
        node_id_set = set()

        def add_node(node_id: str, label: str, node_type: str, category: str, data: Dict[str, Any]):
            if node_id not in node_id_set:
                node_id_set.add(node_id)
                nodes.append({
                    "id": node_id,
                    "label": label,
                    "type": node_type,
                    "category": category,
                    "data": data
                })

        def add_edge(source: str, target: str, relationship: str = "leads_to"):
            edges.append({
                "id": f"e_{source}_{target}",
                "source": source,
                "target": target,
                "relationship": relationship
            })

        init_facts = inference_result.get("initial_facts", {})
        fuzzy_classes = inference_result.get("fuzzy_classifications", {})
        fired_rules = inference_result.get("fired_rules", [])
        unfired_rules = inference_result.get("unfired_rules", [])
        derived_facts = inference_result.get("derived_facts", {})
        recommendations = inference_result.get("recommendations", [])

        # 1. Fact Nodes (Raw inputs)
        fact_mappings = [
            ("fact_oiliness", "Oiliness", init_facts.get("oiliness", 0), "%", "oiliness"),
            ("fact_hydration", "Hydration", init_facts.get("hydration", 0), "%", "hydration"),
            ("fact_sensitivity", "Sensitivity", init_facts.get("sensitivity", 0), "%", "sensitivity"),
            ("fact_redness", "Redness", init_facts.get("redness", 0), "%", "redness"),
            ("fact_dryness", "Dryness", init_facts.get("dryness", 0), "%", "dryness"),
            ("fact_acne", "Acne Concern", init_facts.get("acne_concern", 0), "%", "acne_concern"),
            ("fact_uv", "UV Index", init_facts.get("uv_index", 0), "", "uv_index"),
            ("fact_humidity", "Humidity", init_facts.get("humidity", 0), "%", "humidity"),
        ]

        for fid, flabel, fval, unit, fuzzy_key in fact_mappings:
            add_node(
                node_id=fid,
                label=f"{flabel}: {fval}{unit}",
                node_type="FACT",
                category="Observed Input",
                data={
                    "name": flabel,
                    "value": f"{fval}{unit}",
                    "description": f"User-observed input parameter recorded at {fval}{unit}."
                }
            )

            # 2. Fuzzy Membership Nodes
            if fuzzy_key in fuzzy_classes and fuzzy_classes[fuzzy_key]:
                f_data = fuzzy_classes[fuzzy_key]
                f_dom = f_data.get("dominant", "UNKNOWN")
                f_deg = f_data.get("degree", 0.0)
                fuzzy_nid = f"fuzzy_{fuzzy_key}_{f_dom}"

                add_node(
                    node_id=fuzzy_nid,
                    label=f"{flabel} is {f_dom} (μ={f_deg:.2f})",
                    node_type="FUZZY",
                    category="Fuzzy Logic",
                    data={
                        "variable": flabel,
                        "dominant_term": f_dom,
                        "membership_degree": f_deg,
                        "all_memberships": f_data.get("memberships", {}),
                        "explanation": f_data.get("description", "")
                    }
                )
                add_edge(fid, fuzzy_nid, "fuzzified_to")

        # Connect symptoms if present
        symptoms = init_facts.get("symptoms", {})
        if symptoms.get("burning"):
            add_node(
                node_id="fact_symptom_burning",
                label="Burning Sensation Reported",
                node_type="FACT",
                category="Symptom Fact",
                data={"name": "Burning", "value": "Present", "description": "User reported acute stinging or burning sensation."}
            )
        if symptoms.get("blistering") or symptoms.get("severe_swelling") or symptoms.get("persistent_weeks", 0) >= 2:
            add_node(
                node_id="fact_symptom_severe",
                label="Severe Clinical Symptoms Reported",
                node_type="FACT",
                category="Symptom Fact",
                data={"name": "Red-Flag Symptom", "value": "Present", "description": "Severe swelling, blistering, or chronic persistence reported."}
            )

        # 3. Rule Nodes & Edges
        for fired in fired_rules:
            rid = fired["rule_id"]
            rule_nid = f"rule_{rid}"

            add_node(
                node_id=rule_nid,
                label=f"{rid}: {fired['name']}",
                node_type="RULE",
                category="Production Rule (FIRED)",
                data={
                    "rule_id": rid,
                    "name": fired["name"],
                    "priority": fired["priority"],
                    "status": "FIRED",
                    "conditions_summary": fired["conditions_summary"],
                    "activation_strength": fired["activation_strength"],
                    "condition_details": fired["details"],
                    "derived_consequents": fired["consequents"],
                    "faculty_rationale": fired["faculty_rationale"],
                    "description": fired["description"]
                }
            )

            # Causal links into rule
            if rid == "R01":
                add_edge("fuzzy_oiliness_HIGH", rule_nid, "antecedent")
                add_edge("fuzzy_hydration_LOW", rule_nid, "antecedent")
            elif rid == "R02":
                add_edge("fuzzy_sensitivity_HIGH", rule_nid, "antecedent")
                add_edge("fuzzy_redness_HIGH", rule_nid, "antecedent")
            elif rid == "R03":
                add_edge("derived_irritation_concern", rule_nid, "antecedent_derived")
                if symptoms.get("burning"):
                    add_edge("fact_symptom_burning", rule_nid, "antecedent")
                else:
                    add_edge("fact_irritation", rule_nid, "antecedent")
            elif rid == "R04":
                add_edge("fact_symptom_severe", rule_nid, "antecedent")
            elif rid == "R05":
                add_edge("fact_uv", rule_nid, "antecedent")
            elif rid == "R06":
                add_edge("fuzzy_hydration_LOW", rule_nid, "antecedent")
                add_edge("fuzzy_dryness_HIGH", rule_nid, "antecedent")
            elif rid == "R08":
                add_edge("derived_recovery_mode", rule_nid, "antecedent_derived")
            elif rid == "R09":
                add_edge("fuzzy_acne_HIGH", rule_nid, "antecedent")
                add_edge("fuzzy_oiliness_HIGH", rule_nid, "antecedent")
            elif rid == "R11":
                add_edge("fact_humidity", rule_nid, "antecedent")
                add_edge("fuzzy_hydration_LOW", rule_nid, "antecedent")
            elif rid == "R14":
                add_edge("fuzzy_dryness_HIGH", rule_nid, "antecedent")
                add_edge("fuzzy_sensitivity_HIGH", rule_nid, "antecedent")

            # 4. Derived Fact Nodes asserted by this rule
            for fact_k, fact_v in fired["consequents"].items():
                derived_nid = f"derived_{fact_k}"
                add_node(
                    node_id=derived_nid,
                    label=f"Asserted: {fact_k} = {fact_v}",
                    node_type="DERIVED",
                    category="Derived Clinical Fact",
                    data={
                        "fact_key": fact_k,
                        "fact_value": fact_v,
                        "source_rule": rid,
                        "description": f"Fact asserted into working memory by {rid}."
                    }
                )
                add_edge(rule_nid, derived_nid, "asserts")

        # 5. Recommendation Nodes
        for i, rec in enumerate(recommendations[:5]):
            rec_nid = f"rec_{i}"
            add_node(
                node_id=rec_nid,
                label=rec["title"],
                node_type="ACTION",
                category="Adaptive Decision",
                data={
                    "title": rec["title"],
                    "action": rec["action"],
                    "tag": rec.get("tag", "Guidance"),
                    "source_rule": rec.get("source_rule_id", "Expert System")
                }
            )
            rule_src = f"rule_{rec.get('source_rule_id')}"
            if rule_src in node_id_set:
                add_edge(rule_src, rec_nid, "generates_action")

        # Academic FOAI Technical Reasoning Synthesis
        technical_summary = {
            "paradigm": "Pure Symbolic Production System with Forward Chaining and Zadeh Fuzzy Logic",
            "working_memory_size": len(init_facts) + len(derived_facts),
            "cycles_to_quiescence": inference_result.get("cycles_to_quiescence", 1),
            "conflict_resolution": "Static Rule Priority Descending + Specificity Ordering",
            "fuzzy_operator": "Zadeh Min-Intersection t-norm: μ(A ∩ B) = min(μ_A, μ_B)",
            "fired_rule_count": len(fired_rules),
            "unfired_rule_count": len(unfired_rules),
            "rules_summary": [
                {
                    "rule_id": r["rule_id"],
                    "name": r["name"],
                    "priority": r["priority"],
                    "category": r["category"],
                    "activation_strength": r["activation_strength"],
                    "consequents": r["consequents"]
                }
                for r in fired_rules
            ],
            "unfired_summary": [
                {
                    "rule_id": u["rule_id"],
                    "name": u["name"],
                    "category": u["category"],
                    "priority": u["priority"],
                    "conditions": u["conditions_summary"],
                    "unsatisfied_details": u["details"]
                }
                for u in unfired_rules
            ]
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "technical_summary": technical_summary,
            "execution_trace": inference_result.get("execution_trace", [])
        }
