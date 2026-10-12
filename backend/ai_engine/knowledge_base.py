"""
AI Knowledge Base Module for Skin Care Expert System.
Defines symbolic production rules (IF-THEN), conditions, antecedent checkers,
consequents, conflict-resolution priorities, and educational recommendations.
"""

from typing import Dict, Any, List


class Rule:
    def __init__(
        self,
        rule_id: str,
        name: str,
        category: str,
        priority: int,
        conditions_summary: str,
        description: str,
        faculty_rationale: str,
        antecedents_fn,
        consequents_dict: Dict[str, Any],
        recommendations: List[Dict[str, str]],
        suppressions: List[str] = None
    ):
        self.rule_id = rule_id
        self.name = name
        self.category = category
        self.priority = priority
        self.conditions_summary = conditions_summary
        self.description = description
        self.faculty_rationale = faculty_rationale
        self.antecedents_fn = antecedents_fn
        self.consequents_dict = consequents_dict
        self.recommendations = recommendations or []
        self.suppressions = suppressions or []

    def evaluate(self, working_memory: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates antecedents against working memory.
        Returns: {
            'fired': bool,
            'activation_strength': float (fuzzy degree [0-1]),
            'evaluated_conditions': list of condition details
        }
        """
        return self.antecedents_fn(working_memory)


def build_knowledge_base() -> List[Rule]:
    """Constructs the canonical rule-base for the symbolic expert system."""

    rules = [
        # R01: Dehydrated Oily Skin
        Rule(
            rule_id="R01",
            name="Dehydrated Oily Skin Complex Detection",
            category="Skin State Classification",
            priority=80,
            conditions_summary="IF oiliness is HIGH AND hydration is LOW",
            description="Identifies oily surface skin that paradoxically lacks deep stratum corneum moisture.",
            faculty_rationale="Symbolic production rule classifying a common dermatological contradiction where surface sebum hyperproduction compensates for transepidermal water deficit.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.45 and
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.45
                ),
                "activation_strength": min(
                    wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0)
                ),
                "details": [
                    {
                        "parameter": "Oiliness (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.45",
                        "actual_value": f"{wm.get('oiliness', 0)}% (μ={wm.get('oiliness_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.45
                    },
                    {
                        "parameter": "Hydration (LOW)",
                        "required_threshold": "μ(LOW) >= 0.45",
                        "actual_value": f"{wm.get('hydration', 0)}% (μ={wm.get('hydration_fuzzy', {}).get('memberships', {}).get('LOW', 0):.2f})",
                        "satisfied": wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.45
                    }
                ]
            },
            consequents_dict={
                "derived_state": "OILY_WITH_LOW_HYDRATION",
                "sebum_hydration_mismatch": True,
                "barrier_lipid_film": "SURFACE_ONLY"
            },
            recommendations=[
                {
                    "title": "Humectant-First Water Binding",
                    "action": "Use lightweight hydrating essences containing Glycerin, Beta-Glucan, or multi-molecular Hyaluronic Acid on damp skin.",
                    "tag": "Hydration Focus"
                },
                {
                    "title": "Avoid Harsh Mattifying Alcohol",
                    "action": "Avoid alcohol-heavy astringents that strip surface moisture and trigger rebound oil surges.",
                    "tag": "Guidance"
                }
            ]
        ),

        # R02: Elevated Irritation Concern
        Rule(
            rule_id="R02",
            name="Elevated Cutaneous Irritation Detection",
            category="Irritation & Barrier",
            priority=90,
            conditions_summary="IF sensitivity is HIGH AND redness is HIGH",
            description="Detects concurrent neurosensory hyperreactivity and vascular erythema indicating barrier distress.",
            faculty_rationale="Conjunctive rule detecting early barrier impairment before complete mechanical breakdown.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40 and
                    wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                ),
                "activation_strength": min(
                    wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                    wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0)
                ),
                "details": [
                    {
                        "parameter": "Sensitivity (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.40",
                        "actual_value": f"{wm.get('sensitivity', 0)}% (μ={wm.get('sensitivity_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    },
                    {
                        "parameter": "Redness (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.40",
                        "actual_value": f"{wm.get('redness', 0)}% (μ={wm.get('redness_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    }
                ]
            },
            consequents_dict={
                "irritation_concern": "ELEVATED",
                "microvascular_dilation": True,
                "barrier_vulnerability": "HIGH"
            },
            recommendations=[
                {
                    "title": "Soothe Vascular Erythema",
                    "action": "Incorporate soothing botanical agents such as Centella Asiatica (Cica), Madecassoside, or Bisabolol.",
                    "tag": "Calming"
                },
                {
                    "title": "Minimalist Cleansing",
                    "action": "Switch to a non-foaming, physiological pH (5.5) cleanser without added essential oils or fragrance.",
                    "tag": "Cleanser"
                }
            ]
        ),

        # R03: Skin Recovery Mode Activation
        Rule(
            rule_id="R03",
            name="Skin Recovery Mode Activation Trigger",
            category="Recovery Mode",
            priority=96,
            conditions_summary="IF irritation_concern == ELEVATED AND (burning_symptom == True OR irritation >= 65)",
            description="Activates comprehensive protective protocol when barrier irritation crosses acute discomfort thresholds.",
            faculty_rationale="Higher-order forward chaining rule: evaluates derived fact from R02 combined with crisp symptom assertions.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED" and (
                        wm.get("symptoms", {}).get("burning", False) is True or
                        float(wm.get("irritation", 0)) >= 65.0
                    )
                ),
                "activation_strength": 1.0 if (
                    wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED" and (
                        wm.get("symptoms", {}).get("burning", False) is True or
                        float(wm.get("irritation", 0)) >= 65.0
                    )
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Derived: irritation_concern",
                        "required_threshold": "ELEVATED (from R02)",
                        "actual_value": wm.get("derived_facts", {}).get("irritation_concern", "NORMAL"),
                        "satisfied": wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED"
                    },
                    {
                        "parameter": "Acute Symptom (Burning or Discomfort >= 65)",
                        "required_threshold": "burning==True OR irritation >= 65",
                        "actual_value": f"burning={wm.get('symptoms', {}).get('burning', False)}, irritation={wm.get('irritation', 0)}",
                        "satisfied": (
                            wm.get("symptoms", {}).get("burning", False) is True or
                            float(wm.get("irritation", 0)) >= 65.0
                        )
                    }
                ]
            },
            consequents_dict={
                "recovery_mode": "ACTIVE",
                "operating_mode": "RECOVERY_MODE",
                "active_recovery_protocol": True
            },
            recommendations=[
                {
                    "title": "🚨 SKIN RECOVERY PROTOCOL ACTIVE",
                    "action": "Cease all potent exfoliants, acids (AHA/BHA), retinoids, and vitamin C serums immediately.",
                    "tag": "Critical Action"
                },
                {
                    "title": "Gentle Physiological Lipid Cocoon",
                    "action": "Use only a mild rinse, thermal water / gentle hydrating mist, and a pure barrier repairing balm containing ceramides, cholesterol, and fatty acids.",
                    "tag": "Barrier Care"
                }
            ],
            suppressions=["EXFOLIATION_ADVICE", "RETINOID_ADVICE", "AGGRESSIVE_ACTIVES"]
        ),

        # R04: Professional Clinical Evaluation Alert
        Rule(
            rule_id="R04",
            name="Clinical Dermatological Evaluation Alert",
            category="Safety & Referral",
            priority=100,
            conditions_summary="IF severe/persistent symptoms reported (blistering, severe swelling, intense pain, or > 2 weeks)",
            description="Mandatory academic safety rule: directs user to qualified medical dermatologists for red-flag symptoms.",
            faculty_rationale="Safety threshold constraint ensuring AI system does not diagnose or manage medical pathologies.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("symptoms", {}).get("blistering", False) is True or
                    wm.get("symptoms", {}).get("severe_swelling", False) is True or
                    wm.get("symptoms", {}).get("intense_pain", False) is True or
                    wm.get("symptoms", {}).get("persistent_weeks", 0) >= 2 or
                    wm.get("symptoms", {}).get("bleeding_crusting", False) is True
                ),
                "activation_strength": 1.0 if (
                    wm.get("symptoms", {}).get("blistering", False) is True or
                    wm.get("symptoms", {}).get("severe_swelling", False) is True or
                    wm.get("symptoms", {}).get("intense_pain", False) is True or
                    wm.get("symptoms", {}).get("persistent_weeks", 0) >= 2 or
                    wm.get("symptoms", {}).get("bleeding_crusting", False) is True
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Red-Flag Symptoms",
                        "required_threshold": "blistering OR severe swelling OR pain OR duration >= 2 weeks",
                        "actual_value": f"blistering={wm.get('symptoms', {}).get('blistering', False)}, swelling={wm.get('symptoms', {}).get('severe_swelling', False)}, pain={wm.get('symptoms', {}).get('intense_pain', False)}, duration={wm.get('symptoms', {}).get('persistent_weeks', 0)} wks",
                        "satisfied": (
                            wm.get("symptoms", {}).get("blistering", False) is True or
                            wm.get("symptoms", {}).get("severe_swelling", False) is True or
                            wm.get("symptoms", {}).get("intense_pain", False) is True or
                            wm.get("symptoms", {}).get("persistent_weeks", 0) >= 2 or
                            wm.get("symptoms", {}).get("bleeding_crusting", False) is True
                        )
                    }
                ]
            },
            consequents_dict={
                "professional_evaluation_alert": True,
                "medical_triage_required": True,
                "safety_escalation_level": "CRITICAL"
            },
            recommendations=[
                {
                    "title": "⚠️ Seek Professional Dermatological Consultation",
                    "action": "Your reported symptoms indicate possible acute contact allergy, infection, or severe dermatosis requiring clinical in-person examination.",
                    "tag": "Medical Alert"
                },
                {
                    "title": "Do Not Self-Medicate",
                    "action": "Discontinue all topical cosmetics and consult a board-certified physician or dermatologist.",
                    "tag": "Safety Notice"
                }
            ]
        ),

        # R05: High UV Index Protection
        Rule(
            rule_id="R05",
            name="Photoprotection Escalation Rule",
            category="Environmental Adaptation",
            priority=70,
            conditions_summary="IF UV index is HIGH or EXTREME (UV >= 6.0)",
            description="Increases sun-protection priority and recommends broad-spectrum physical or chemical filters.",
            faculty_rationale="Contextual environmental reasoning adapting protective recommendations based on ambient solar radiation.",
            antecedents_fn=lambda wm: {
                "fired": float(wm.get("uv_index", 0)) >= 6.0 or wm.get("uv_fuzzy", {}).get("dominant") in ["HIGH", "EXTREME"],
                "activation_strength": wm.get("uv_fuzzy", {}).get("memberships", {}).get("HIGH", 0) or 0.8,
                "details": [
                    {
                        "parameter": "UV Index",
                        "required_threshold": "UV >= 6.0 OR dominant HIGH/EXTREME",
                        "actual_value": f"{wm.get('uv_index', 0)} ({wm.get('uv_fuzzy', {}).get('dominant', 'UNKNOWN')})",
                        "satisfied": float(wm.get("uv_index", 0)) >= 6.0 or wm.get("uv_fuzzy", {}).get("dominant") in ["HIGH", "EXTREME"]
                    }
                ]
            },
            consequents_dict={
                "sun_protection_priority": "HIGH",
                "broad_spectrum_spf_required": True,
                "uv_defense_protocol": "ACTIVE"
            },
            recommendations=[
                {
                    "title": "Broad Spectrum SPF 50+ Reapplication",
                    "action": "Apply 1/4 teaspoon (two fingers) of Broad-Spectrum SPF 50+ PA++++ every 2 hours during continuous daylight exposure.",
                    "tag": "Sun Defense"
                },
                {
                    "title": "Physical UV Shielding",
                    "action": "Utilize wide-brimmed hats and polarized UV400 sunglasses during peak solar hours (10:00 - 16:00).",
                    "tag": "Lifestyle Shield"
                }
            ]
        ),

        # R06: Severe Dryness & Lipid Deficiency
        Rule(
            rule_id="R06",
            name="Cutaneous Xerosis & Lipid Deficiency",
            category="Skin State Classification",
            priority=75,
            conditions_summary="IF hydration is LOW AND dryness is HIGH",
            description="Detects dual-phase moisture starvation: insufficient natural moisturizing factors (NMF) and intercellular lipids.",
            faculty_rationale="Fuzzy conjunction modeling xerotic skin conditions lacking both water and occlusive barrier lipids.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.40 and
                    wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                ),
                "activation_strength": min(
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0),
                    wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0)
                ),
                "details": [
                    {
                        "parameter": "Hydration (LOW)",
                        "required_threshold": "μ(LOW) >= 0.40",
                        "actual_value": f"{wm.get('hydration', 0)}% (μ={wm.get('hydration_fuzzy', {}).get('memberships', {}).get('LOW', 0):.2f})",
                        "satisfied": wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.40
                    },
                    {
                        "parameter": "Dryness (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.40",
                        "actual_value": f"{wm.get('dryness', 0)}% (μ={wm.get('dryness_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    }
                ]
            },
            consequents_dict={
                "dryness_concern": "ELEVATED",
                "barrier_lipid_deficiency": True,
                "stratum_corneum_flaking_risk": "HIGH"
            },
            recommendations=[
                {
                    "title": "Lipid-Replenishing Occlusive Emollient",
                    "action": "Incorporate creams formulated with Shea Butter, Squalane, or physiological Ceramides 1, 3, 6-II to seal micro-fissures.",
                    "tag": "Lipid Replenishment"
                },
                {
                    "title": "Tepid Water Only",
                    "action": "Wash face strictly with lukewarm/tepid water; hot water strips remaining intercellular lipid bilayers.",
                    "tag": "Cleansing Habit"
                }
            ]
        ),

        # R07: Assessment Completeness Verification
        Rule(
            rule_id="R07",
            name="Assessment Completeness Verification",
            category="Completeness",
            priority=60,
            conditions_summary="IF assessment_completeness_ratio < 0.70",
            description="Monitors missing facts in working memory and adjusts diagnostic certainty flag.",
            faculty_rationale="Meta-knowledge rule in symbolic AI: reasoning about the completeness of the system's own input knowledge.",
            antecedents_fn=lambda wm: {
                "fired": float(wm.get("completeness_ratio", 1.0)) < 0.70,
                "activation_strength": 1.0 if float(wm.get("completeness_ratio", 1.0)) < 0.70 else 0.0,
                "details": [
                    {
                        "parameter": "Completeness Ratio",
                        "required_threshold": "Completeness < 70%",
                        "actual_value": f"{int(float(wm.get('completeness_ratio', 1.0)) * 100)}%",
                        "satisfied": float(wm.get("completeness_ratio", 1.0)) < 0.70
                    }
                ]
            },
            consequents_dict={
                "assessment_completeness": "LIMITED",
                "completeness_warning": True
            },
            recommendations=[
                {
                    "title": "Complete Environmental & Lifestyle Details",
                    "action": "Some environmental (UV, humidity) or lifestyle (sleep, outdoor hours) parameters were omitted. Completing them refines twin fidelity.",
                    "tag": "Data Completeness"
                }
            ]
        ),

        # R08: Recovery Mode Regimen Conflict Suppression
        Rule(
            rule_id="R08",
            name="Recovery Mode Regimen Conflict Suppression",
            category="Recovery Mode",
            priority=98,
            conditions_summary="IF recovery_mode == ACTIVE",
            description="Suppresses any conflicting aggressive active recommendations generated by other rules.",
            faculty_rationale="Conflict resolution mechanism: non-monotonic suppression ensuring safety overrides routine optimization.",
            antecedents_fn=lambda wm: {
                "fired": wm.get("derived_facts", {}).get("recovery_mode") == "ACTIVE",
                "activation_strength": 1.0 if wm.get("derived_facts", {}).get("recovery_mode") == "ACTIVE" else 0.0,
                "details": [
                    {
                        "parameter": "Derived: recovery_mode",
                        "required_threshold": "ACTIVE",
                        "actual_value": wm.get("derived_facts", {}).get("recovery_mode", "INACTIVE"),
                        "satisfied": wm.get("derived_facts", {}).get("recovery_mode") == "ACTIVE"
                    }
                ]
            },
            consequents_dict={
                "suppress_routine_actives": True,
                "gentle_regimen_only": True,
                "active_ingredient_embargo": True
            },
            recommendations=[
                {
                    "title": "Strict Cosmetic Embargo",
                    "action": "All chemical exfoliants (Glycolic, Salicylic, Lactic acids) and retinoids are locked out until barrier restabilization.",
                    "tag": "Safety Embargo"
                }
            ]
        ),

        # R09: Comedonal Acne Risk
        Rule(
            rule_id="R09",
            name="Comedonal Sebum Congestion Detection",
            category="Skin State Classification",
            priority=72,
            conditions_summary="IF acne_concern is HIGH AND oiliness is HIGH AND recovery_mode != ACTIVE",
            description="Identifies pore congestion risk under excess sebum when skin barrier is not inflamed.",
            faculty_rationale="Conditional rule with safety negation (ensures actives are not suggested during recovery mode).",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("acne_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.45 and
                    wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40 and
                    wm.get("derived_facts", {}).get("recovery_mode") != "ACTIVE"
                ),
                "activation_strength": min(
                    wm.get("acne_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                    wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0)
                ),
                "details": [
                    {
                        "parameter": "Acne Concern (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.45",
                        "actual_value": f"{wm.get('acne_concern', 0)}% (μ={wm.get('acne_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("acne_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.45
                    },
                    {
                        "parameter": "Oiliness (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.40",
                        "actual_value": f"{wm.get('oiliness', 0)}% (μ={wm.get('oiliness_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("oiliness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    },
                    {
                        "parameter": "Recovery Mode Inactive",
                        "required_threshold": "recovery_mode != ACTIVE",
                        "actual_value": wm.get("derived_facts", {}).get("recovery_mode", "INACTIVE"),
                        "satisfied": wm.get("derived_facts", {}).get("recovery_mode") != "ACTIVE"
                    }
                ]
            },
            consequents_dict={
                "comedonal_congestion_risk": "ELEVATED",
                "salicylic_acid_candidate": True,
                "sebum_regulation_needed": True
            },
            recommendations=[
                {
                    "title": "Gentle Lipophilic Exfoliation (BHA)",
                    "action": "Consider introducing a gentle 1-2% Salicylic Acid formula 2x/week to dissolve trapped pore sebum and keratin plugs.",
                    "tag": "Clarifying"
                },
                {
                    "title": "Niacinamide Sebum Balancing",
                    "action": "Incorporate 2-5% Niacinamide serum to assist in modulating excessive sebaceous gland secretion.",
                    "tag": "Oil Control"
                }
            ]
        ),

        # R10: Suspected Contact Dermatitis from New Products
        Rule(
            rule_id="R10",
            name="Product-Induced Contact Sensitization Alert",
            category="Irritation & Barrier",
            priority=92,
            conditions_summary="IF newly_introduced_products == True AND irritation_concern == ELEVATED",
            description="Correlates newly introduced cosmetics with recent spike in cutaneous irritation.",
            faculty_rationale="Causal associative rule linking temporal product introduction to emergent barrier distress.",
            antecedents_fn=lambda wm: {
                "fired": (
                    bool(wm.get("newly_introduced_products", False)) is True and
                    wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED"
                ),
                "activation_strength": 0.90 if (
                    bool(wm.get("newly_introduced_products", False)) is True and
                    wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED"
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Newly Introduced Products",
                        "required_threshold": "True",
                        "actual_value": str(wm.get("newly_introduced_products", False)),
                        "satisfied": bool(wm.get("newly_introduced_products", False)) is True
                    },
                    {
                        "parameter": "Derived: irritation_concern",
                        "required_threshold": "ELEVATED",
                        "actual_value": wm.get("derived_facts", {}).get("irritation_concern", "NORMAL"),
                        "satisfied": wm.get("derived_facts", {}).get("irritation_concern") == "ELEVATED"
                    }
                ]
            },
            consequents_dict={
                "contact_dermatitis_suspected": True,
                "pause_new_products": True,
                "cosmetic_elimination_diet": True
            },
            recommendations=[
                {
                    "title": "Pause Newly Added Skincare Formula",
                    "action": "Immediately suspend recent cosmetic acquisitions. Revert to your baseline gentle routine until symptoms subside.",
                    "tag": "Elimination Guidance"
                },
                {
                    "title": "Patch Testing Mandate",
                    "action": "When skin stabilizes, conduct a 48-hour inner-forearm patch test before re-attempting application.",
                    "tag": "Precaution"
                }
            ]
        ),

        # R11: Low Ambient Humidity TEWL Acceleration
        Rule(
            rule_id="R11",
            name="Low Ambient Humidity TEWL Stress",
            category="Environmental Adaptation",
            priority=65,
            conditions_summary="IF ambient humidity is LOW (< 40%) AND hydration is LOW",
            description="Recognizes accelerated transepidermal water evaporation in arid atmospheric conditions.",
            faculty_rationale="Biophysical rule integrating environmental meteorology with stratum corneum hydration kinetics.",
            antecedents_fn=lambda wm: {
                "fired": (
                    (float(wm.get("humidity", 50)) < 40 or wm.get("humidity_fuzzy", {}).get("dominant") == "LOW") and
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.40
                ),
                "activation_strength": min(
                    wm.get("humidity_fuzzy", {}).get("memberships", {}).get("LOW", 0) or 0.6,
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0)
                ),
                "details": [
                    {
                        "parameter": "Humidity (LOW)",
                        "required_threshold": "Humidity < 40% OR μ(LOW) dominant",
                        "actual_value": f"{wm.get('humidity', 50)}%",
                        "satisfied": float(wm.get("humidity", 50)) < 40 or wm.get("humidity_fuzzy", {}).get("dominant") == "LOW"
                    },
                    {
                        "parameter": "Hydration (LOW)",
                        "required_threshold": "μ(LOW) >= 0.40",
                        "actual_value": f"{wm.get('hydration', 0)}% (μ={wm.get('hydration_fuzzy', {}).get('memberships', {}).get('LOW', 0):.2f})",
                        "satisfied": wm.get("hydration_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.40
                    }
                ]
            },
            consequents_dict={
                "transepidermal_water_loss_risk": "HIGH",
                "occlusive_seal_recommended": True
            },
            recommendations=[
                {
                    "title": "Humidifier & Occlusive Layering",
                    "action": "In arid environments, applying humectants alone draws water out of skin; seal with an occlusive balm and run an ultrasonic room humidifier.",
                    "tag": "Environmental Defense"
                }
            ]
        ),

        # R12: Circadian Sleep Deprivation Stress
        Rule(
            rule_id="R12",
            name="Circadian Sleep Deficit & Microcirculation Stress",
            category="Lifestyle Adaptation",
            priority=52,
            conditions_summary="IF sleep_hours < 6.0 AND redness is HIGH",
            description="Identifies insufficient nocturnal regeneration as an amplifier of cutaneous erythema.",
            faculty_rationale="Biopsychosocial knowledge rule connecting circadian physiology with microvascular tone.",
            antecedents_fn=lambda wm: {
                "fired": (
                    float(wm.get("sleep_hours", 7)) < 6.0 and
                    wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                ),
                "activation_strength": wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                "details": [
                    {
                        "parameter": "Sleep Duration",
                        "required_threshold": "Sleep < 6.0 hours",
                        "actual_value": f"{wm.get('sleep_hours', 7)} hrs",
                        "satisfied": float(wm.get("sleep_hours", 7)) < 6.0
                    },
                    {
                        "parameter": "Redness (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.40",
                        "actual_value": f"{wm.get('redness', 0)}% (μ={wm.get('redness_fuzzy', {}).get('memberships', {}).get('HIGH', 0):.2f})",
                        "satisfied": wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    }
                ]
            },
            consequents_dict={
                "circadian_stress_impact": "ELEVATED",
                "overnight_barrier_support": True
            },
            recommendations=[
                {
                    "title": "Overnight Regenerative Support",
                    "action": "Use an overnight sleeping mask containing Panthenol and Peptides to support recovery during reduced rest periods.",
                    "tag": "Sleep Recovery"
                }
            ]
        ),

        # R13: Optimal Barrier Homeostasis
        Rule(
            rule_id="R13",
            name="Optimal Epidermal Homeostasis",
            category="Skin State Classification",
            priority=40,
            conditions_summary="IF hydration is HIGH AND oiliness is LOW/MEDIUM AND redness is LOW AND sensitivity is LOW",
            description="Validates a well-balanced, resilient skin barrier in equilibrium.",
            faculty_rationale="Baseline equilibrium rule in expert systems denoting stable physiological state.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.50 and
                    wm.get("redness_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.50 and
                    wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.50 and
                    wm.get("derived_facts", {}).get("recovery_mode") != "ACTIVE"
                ),
                "activation_strength": min(
                    wm.get("hydration_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                    wm.get("redness_fuzzy", {}).get("memberships", {}).get("LOW", 0),
                    wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("LOW", 0)
                ),
                "details": [
                    {
                        "parameter": "Hydration (HIGH)",
                        "required_threshold": "μ(HIGH) >= 0.50",
                        "actual_value": f"{wm.get('hydration', 0)}%",
                        "satisfied": wm.get("hydration_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.50
                    },
                    {
                        "parameter": "Redness (LOW)",
                        "required_threshold": "μ(LOW) >= 0.50",
                        "actual_value": f"{wm.get('redness', 0)}%",
                        "satisfied": wm.get("redness_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.50
                    },
                    {
                        "parameter": "Sensitivity (LOW)",
                        "required_threshold": "μ(LOW) >= 0.50",
                        "actual_value": f"{wm.get('sensitivity', 0)}%",
                        "satisfied": wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("LOW", 0) >= 0.50
                    }
                ]
            },
            consequents_dict={
                "skin_barrier_status": "OPTIMAL_HOMEOSTASIS",
                "maintenance_mode": True
            },
            recommendations=[
                {
                    "title": "Maintain Protective Regimen",
                    "action": "Your cutaneous barrier demonstrates healthy equilibrium. Maintain current gentle cleansing, daily hydration, and sun protection.",
                    "tag": "Maintenance"
                }
            ]
        ),

        # R14: Stratum Corneum Vulnerability & Ceramide Protocol
        Rule(
            rule_id="R14",
            name="Stratum Corneum Vulnerability & Lipid Protocol",
            category="Irritation & Barrier",
            priority=85,
            conditions_summary="IF barrier_concern is HIGH OR (dryness is HIGH AND sensitivity is HIGH)",
            description="Detects depletion of natural ceramides and stratum corneum lipid matrix integrity.",
            faculty_rationale="Disjunctive production rule asserting vulnerable barrier state across subjective and sensory metrics.",
            antecedents_fn=lambda wm: {
                "fired": (
                    float(wm.get("barrier_concern", 0)) >= 60.0 or (
                        wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40 and
                        wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    )
                ),
                "activation_strength": max(
                    0.8 if float(wm.get("barrier_concern", 0)) >= 60.0 else 0.0,
                    min(
                        wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0),
                        wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0)
                    )
                ),
                "details": [
                    {
                        "parameter": "User Barrier Concern OR (Dryness & Sensitivity High)",
                        "required_threshold": "Barrier >= 60 OR (Dryness High AND Sensitivity High)",
                        "actual_value": f"barrier={wm.get('barrier_concern', 0)}%, dry={wm.get('dryness', 0)}%, sens={wm.get('sensitivity', 0)}%",
                        "satisfied": (
                            float(wm.get("barrier_concern", 0)) >= 60.0 or (
                                wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40 and
                                wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                            )
                        )
                    }
                ]
            },
            consequents_dict={
                "stratum_corneum_vulnerability": "ELEVATED",
                "ceramide_protocol": True,
                "skin_barrier_status": "VULNERABLE"
            },
            recommendations=[
                {
                    "title": "3:1:1 Physiological Lipid Ratio Emulsion",
                    "action": "Use barrier repair formulations providing Ceramides, Cholesterol, and Free Fatty Acids in the physiological 3:1:1 molar ratio.",
                    "tag": "Lipid Repair"
                }
            ]
        ),

        # R15: Extended Outdoor Photo-Oxidative Stress
        Rule(
            rule_id="R15",
            name="Extended Outdoor Photo-Oxidative Defense",
            category="Environmental Adaptation",
            priority=68,
            conditions_summary="IF outdoor_hours >= 4.0 AND UV index >= 4.0",
            description="Addresses cumulative reactive oxygen species (ROS) exposure from prolonged atmospheric outdoor presence.",
            faculty_rationale="Production rule modulating antioxidant defense needs based on continuous environmental exposure.",
            antecedents_fn=lambda wm: {
                "fired": (
                    float(wm.get("outdoor_hours", 0)) >= 4.0 and
                    float(wm.get("uv_index", 0)) >= 4.0
                ),
                "activation_strength": 0.75 if (
                    float(wm.get("outdoor_hours", 0)) >= 4.0 and
                    float(wm.get("uv_index", 0)) >= 4.0
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Outdoor Duration",
                        "required_threshold": "Hours >= 4.0",
                        "actual_value": f"{wm.get('outdoor_hours', 0)} hrs",
                        "satisfied": float(wm.get("outdoor_hours", 0)) >= 4.0
                    },
                    {
                        "parameter": "UV Index",
                        "required_threshold": "UV >= 4.0",
                        "actual_value": str(wm.get("uv_index", 0)),
                        "satisfied": float(wm.get("uv_index", 0)) >= 4.0
                    }
                ]
            },
            consequents_dict={
                "photo_exposure_stress": "ELEVATED",
                "antioxidant_defense_recommended": True
            },
            recommendations=[
                {
                    "title": "Topical Antioxidant Free-Radical Quenching",
                    "action": "Apply a gentle, non-irritating antioxidant serum (such as Ectoin, Green Tea EGCG, or Ferulic Acid derivative) under sunscreen.",
                    "tag": "Antioxidant Shield"
                }
            ]
        ),

        # RULE S01: Dryness or Tightness without Concerning Symptoms
        Rule(
            rule_id="S01",
            name="Cutaneous Dryness & Tightness Barrier Replenishment",
            category="Stratum Corneum Hydration",
            priority=75,
            conditions_summary="IF user reports dryness or tightness AND does not report concerning symptoms",
            description="Prioritizes gentle physiological cleansing, barrier moisturizer, and complete avoidance of harsh stripping products.",
            faculty_rationale="Classic production rule restoring moisture balance by preventing barrier stripping and enhancing lipid replenishment.",
            antecedents_fn=lambda wm: {
                "fired": (
                    (
                        wm.get("dryness_tightness") in ["mild", "moderate", "severe"] or
                        float(wm.get("dryness", 0)) >= 40.0 or
                        wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                    ) and not (
                        wm.get("symptoms", {}).get("burning", False) or
                        wm.get("symptoms", {}).get("blistering", False) or
                        wm.get("symptoms", {}).get("severe_swelling", False) or
                        wm.get("symptoms", {}).get("breathing_difficulty", False)
                    )
                ),
                "activation_strength": 0.85 if (
                    wm.get("dryness_tightness") in ["mild", "moderate", "severe"] or
                    float(wm.get("dryness", 0)) >= 40.0
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Dryness / Tightness Reported",
                        "required_threshold": "dryness >= 40 OR user reports tightness",
                        "actual_value": f"tightness={wm.get('dryness_tightness', 'none')}, dryness={wm.get('dryness', 0)}%",
                        "satisfied": (
                            wm.get("dryness_tightness") in ["mild", "moderate", "severe"] or
                            float(wm.get("dryness", 0)) >= 40.0 or
                            wm.get("dryness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.40
                        )
                    },
                    {
                        "parameter": "Absence of Concerning Acute Symptoms",
                        "required_threshold": "NO burning, blistering, swelling, breathing distress",
                        "actual_value": f"burning={wm.get('symptoms', {}).get('burning', False)}, blistering={wm.get('symptoms', {}).get('blistering', False)}",
                        "satisfied": not (
                            wm.get("symptoms", {}).get("burning", False) or
                            wm.get("symptoms", {}).get("blistering", False) or
                            wm.get("symptoms", {}).get("severe_swelling", False)
                        )
                    }
                ]
            },
            consequents_dict={
                "barrier_replenishment_prioritized": True,
                "recommended_cleanser_type": "GENTLE_NON_FOAMING",
                "recommended_moisturizer_type": "CERAMIDE_RICH"
            },
            recommendations=[
                {
                    "title": "Gentle Cleansing & Moisture Lock",
                    "action": "Use lukewarm water and a non-foaming gentle cleanser; apply a ceramide-rich barrier moisturizer within 60 seconds of washing to lock in stratum corneum moisture.",
                    "tag": "Hydration Focus"
                },
                {
                    "title": "Avoid Harsh Cleansers & Astringents",
                    "action": "Eliminate alcohol toners, physical scrubs, and high-pH soap bars that exacerbate cutaneous tightness.",
                    "tag": "Guidance"
                }
            ]
        ),

        # RULE S02: Sensitivity & Redness
        Rule(
            rule_id="S02",
            name="Vascular Erythema & Sensitivity Routine Simplification",
            category="Irritation & Barrier",
            priority=85,
            conditions_summary="IF user reports sensitivity AND redness",
            description="Suggests simplifying routine, avoiding newly introduced irritating products, and closely monitoring symptoms.",
            faculty_rationale="Neurosensory and vascular reactive rule preventing cascading contact dermatitis through immediate elimination of potential irritants.",
            antecedents_fn=lambda wm: {
                "fired": (
                    (
                        wm.get("user_sensitivity") in ["moderate", "high"] or
                        float(wm.get("sensitivity", 0)) >= 40.0 or
                        wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.35
                    ) and (
                        wm.get("user_redness") in ["mild", "moderate", "marked"] or
                        float(wm.get("redness", 0)) >= 35.0 or
                        wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.35
                    )
                ),
                "activation_strength": 0.90 if (
                    float(wm.get("sensitivity", 0)) >= 40.0 and float(wm.get("redness", 0)) >= 35.0
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Sensitivity Reported",
                        "required_threshold": "sensitivity >= 40% OR moderate/high",
                        "actual_value": f"{wm.get('sensitivity', 0)}% (user: {wm.get('user_sensitivity', 'not_sure')})",
                        "satisfied": (
                            wm.get("user_sensitivity") in ["moderate", "high"] or
                            float(wm.get("sensitivity", 0)) >= 40.0 or
                            wm.get("sensitivity_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.35
                        )
                    },
                    {
                        "parameter": "Redness Observed / Reported",
                        "required_threshold": "redness >= 35% OR mild/moderate/marked",
                        "actual_value": f"{wm.get('redness', 0)}% (user: {wm.get('user_redness', 'not_sure')})",
                        "satisfied": (
                            wm.get("user_redness") in ["mild", "moderate", "marked"] or
                            float(wm.get("redness", 0)) >= 35.0 or
                            wm.get("redness_fuzzy", {}).get("memberships", {}).get("HIGH", 0) >= 0.35
                        )
                    }
                ]
            },
            consequents_dict={
                "simplify_routine": True,
                "avoid_new_products": True,
                "soothing_priority": "HIGH"
            },
            recommendations=[
                {
                    "title": "Simplify Skincare Protocol (Soothing Mode)",
                    "action": "Strip back routine to only 3 essentials: ultra-mild cleanser, hypoallergenic soothing barrier cream, and pure mineral sunscreen.",
                    "tag": "Calming"
                },
                {
                    "title": "Pause Recently Introduced Formulations",
                    "action": "Immediately pause any product introduced in the past 2-4 weeks to isolate potential contact triggers and monitor skin response over 7-14 days.",
                    "tag": "Product Safety"
                }
            ],
            suppressions=["AGGRESSIVE_ACTIVES", "EXFOLIATION_ADVICE"]
        ),

        # RULE S03: Burning or Worsening Irritation
        Rule(
            rule_id="S03",
            name="Acute Burning & Irritation Discontinuation Protocol",
            category="Recovery & Safety",
            priority=95,
            conditions_summary="IF user reports burning or worsening irritation",
            description="Advises discontinuing suspected irritating product, avoiding additional active ingredients, and seeking medical advice if symptoms persist.",
            faculty_rationale="Forward-chaining containment rule halting active topical agents to prevent chemical burns or severe contact dermatitis.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("symptoms", {}).get("burning", False) is True or
                    wm.get("burning_stinging", False) is True or
                    float(wm.get("irritation", 0)) >= 60.0 or
                    wm.get("current_irritation") in ["moderate", "severe"]
                ),
                "activation_strength": 1.0 if (
                    wm.get("symptoms", {}).get("burning", False) or float(wm.get("irritation", 0)) >= 60.0
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Burning or Irritation",
                        "required_threshold": "burning==True OR irritation >= 60 OR moderate/severe",
                        "actual_value": f"burning={wm.get('symptoms', {}).get('burning', False)}, irritation={wm.get('irritation', 0)}",
                        "satisfied": (
                            wm.get("symptoms", {}).get("burning", False) is True or
                            wm.get("burning_stinging", False) is True or
                            float(wm.get("irritation", 0)) >= 60.0 or
                            wm.get("current_irritation") in ["moderate", "severe"]
                        )
                    }
                ]
            },
            consequents_dict={
                "discontinue_suspected_products": True,
                "lockout_actives": True,
                "recovery_mode": "ACTIVE",
                "operating_mode": "RECOVERY_MODE"
            },
            recommendations=[
                {
                    "title": "Discontinue Suspected Irritating Formulations",
                    "action": "Immediately stop applying any suspected new or irritating cosmetic formulation. Wash gently with cool water.",
                    "tag": "Critical Action"
                },
                {
                    "title": "Strict Actives Lockout",
                    "action": "Avoid all active acids (glycolic, salicylic, lactic), retinoids, benzoyl peroxide, and essential oils. Seek professional dermatological consultation if stinging or erythema persists beyond 48 hours.",
                    "tag": "Safety Warning"
                }
            ],
            suppressions=["EXFOLIATION_ADVICE", "RETINOID_ADVICE", "AGGRESSIVE_ACTIVES"]
        ),

        # RULE S04: Facial Swelling, Blistering, Severe Pain, Eye Involvement
        Rule(
            rule_id="S04",
            name="Red-Flag Cutaneous Pathology Medical Evaluation Warning",
            category="Safety & Clinical Referral",
            priority=100,
            conditions_summary="IF user reports facial swelling, blistering, severe pain or eye involvement",
            description="Displays prominent clinical safety warning and advises prompt evaluation by a licensed healthcare provider.",
            faculty_rationale="Critical academic safety constraint prohibiting automated cosmetic management for signs of severe medical pathology.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("symptoms", {}).get("blistering", False) is True or
                    wm.get("symptoms", {}).get("severe_swelling", False) is True or
                    wm.get("symptoms", {}).get("intense_pain", False) is True or
                    wm.get("symptoms", {}).get("facial_swelling", False) is True or
                    wm.get("symptoms", {}).get("eye_involvement", False) is True or
                    wm.get("symptoms", {}).get("bleeding_crusting", False) is True
                ),
                "activation_strength": 1.0 if (
                    wm.get("symptoms", {}).get("blistering", False) or
                    wm.get("symptoms", {}).get("severe_swelling", False) or
                    wm.get("symptoms", {}).get("facial_swelling", False) or
                    wm.get("symptoms", {}).get("eye_involvement", False)
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Red-Flag Symptom Indicators",
                        "required_threshold": "blistering OR facial swelling OR severe pain OR eye involvement",
                        "actual_value": f"blistering={wm.get('symptoms', {}).get('blistering', False)}, swelling={wm.get('symptoms', {}).get('facial_swelling', wm.get('symptoms', {}).get('severe_swelling', False))}, eye={wm.get('symptoms', {}).get('eye_involvement', False)}",
                        "satisfied": (
                            wm.get("symptoms", {}).get("blistering", False) is True or
                            wm.get("symptoms", {}).get("severe_swelling", False) is True or
                            wm.get("symptoms", {}).get("intense_pain", False) is True or
                            wm.get("symptoms", {}).get("facial_swelling", False) is True or
                            wm.get("symptoms", {}).get("eye_involvement", False) is True or
                            wm.get("symptoms", {}).get("bleeding_crusting", False) is True
                        )
                    }
                ]
            },
            consequents_dict={
                "professional_evaluation_alert": True,
                "clinical_referral_urgent": True,
                "operating_mode": "RECOVERY_MODE"
            },
            recommendations=[
                {
                    "title": "⚠️ MEDICAL EVALUATION ADVISED",
                    "action": "Symptoms such as facial swelling, blistering, or periorbital/eye involvement require prompt evaluation by a licensed physician or dermatologist. Do not attempt home treatment or apply cosmetic creams.",
                    "tag": "Clinical Alert"
                }
            ],
            suppressions=["EXFOLIATION_ADVICE", "RETINOID_ADVICE", "AGGRESSIVE_ACTIVES"]
        ),

        # RULE S05: Breathing Difficulty or Potentially Severe Allergic Reaction
        Rule(
            rule_id="S05",
            name="Emergency Medical Assistance Anaphylaxis Warning",
            category="Emergency Safety Protocol",
            priority=105,
            conditions_summary="IF user reports breathing difficulty or potentially severe allergic reaction",
            description="Advises immediate emergency medical assistance.",
            faculty_rationale="Highest-priority life-safety constraint: symptoms suggestive of anaphylaxis or systemic hypersensitivity must trigger urgent emergency care directive.",
            antecedents_fn=lambda wm: {
                "fired": (
                    wm.get("symptoms", {}).get("breathing_difficulty", False) is True or
                    wm.get("symptoms", {}).get("severe_allergic_reaction", False) is True or
                    wm.get("symptoms", {}).get("throat_tightness", False) is True
                ),
                "activation_strength": 1.0 if (
                    wm.get("symptoms", {}).get("breathing_difficulty", False) or
                    wm.get("symptoms", {}).get("severe_allergic_reaction", False)
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Emergency Symptoms",
                        "required_threshold": "breathing difficulty OR severe systemic allergic reaction",
                        "actual_value": f"breathing={wm.get('symptoms', {}).get('breathing_difficulty', False)}, severe_allergy={wm.get('symptoms', {}).get('severe_allergic_reaction', False)}",
                        "satisfied": (
                            wm.get("symptoms", {}).get("breathing_difficulty", False) is True or
                            wm.get("symptoms", {}).get("severe_allergic_reaction", False) is True or
                            wm.get("symptoms", {}).get("throat_tightness", False) is True
                        )
                    }
                ]
            },
            consequents_dict={
                "emergency_alert": True,
                "professional_evaluation_alert": True,
                "emergency_medical_assistance_required": True
            },
            recommendations=[
                {
                    "title": "🚨 EMERGENCY MEDICAL ASSISTANCE REQUIRED",
                    "action": "Breathing difficulty, throat tightness, or rapid facial/lip swelling can indicate a severe systemic allergic reaction (anaphylaxis). Contact local emergency services (e.g., 911, 112) or go to the nearest emergency department immediately.",
                    "tag": "Emergency Action"
                }
            ],
            suppressions=["EXFOLIATION_ADVICE", "RETINOID_ADVICE", "AGGRESSIVE_ACTIVES", "ROUTINE_STEP"]
        ),

        # RULE S06: No Irritation & Basic Maintenance Routine Request
        Rule(
            rule_id="S06",
            name="Standard Cutaneous Barrier Maintenance Protocol",
            category="Healthy Skin Maintenance",
            priority=60,
            conditions_summary="IF user reports no irritation and wants a basic maintenance routine",
            description="Provides a simple cleanser, moisturizer and sunscreen routine for sustained cutaneous equilibrium.",
            faculty_rationale="Baseline forward-chaining rule ensuring simplicity and adherence for non-pathological skin without unnecessary active ingredient overload.",
            antecedents_fn=lambda wm: {
                "fired": (
                    float(wm.get("irritation", 0)) <= 25.0 and
                    float(wm.get("sensitivity", 0)) <= 35.0 and
                    float(wm.get("redness", 0)) <= 30.0 and
                    wm.get("current_irritation", "none") in ["none", "mild"] and
                    not (
                        wm.get("symptoms", {}).get("burning", False) or
                        wm.get("symptoms", {}).get("blistering", False) or
                        wm.get("symptoms", {}).get("severe_swelling", False) or
                        wm.get("symptoms", {}).get("breathing_difficulty", False)
                    )
                ),
                "activation_strength": 0.95 if (
                    float(wm.get("irritation", 0)) <= 25.0 and float(wm.get("sensitivity", 0)) <= 35.0
                ) else 0.0,
                "details": [
                    {
                        "parameter": "Low Cutaneous Irritation",
                        "required_threshold": "irritation <= 25% AND sensitivity <= 35%",
                        "actual_value": f"irritation={wm.get('irritation', 0)}%, sensitivity={wm.get('sensitivity', 0)}%",
                        "satisfied": float(wm.get("irritation", 0)) <= 25.0 and float(wm.get("sensitivity", 0)) <= 35.0
                    },
                    {
                        "parameter": "Absence of Acute Symptoms",
                        "required_threshold": "NO burning, blistering, swelling",
                        "actual_value": "Clean status",
                        "satisfied": not (
                            wm.get("symptoms", {}).get("burning", False) or
                            wm.get("symptoms", {}).get("blistering", False)
                        )
                    }
                ]
            },
            consequents_dict={
                "maintenance_routine_active": True,
                "protocol": "CLEANSER_MOISTURIZER_SPF_TRIAD"
            },
            recommendations=[
                {
                    "title": "Core Daily Skincare Triad",
                    "action": "Maintain skin barrier health with the proven core trio: gentle pH 5.5 cleanser, ceramide/humectant moisturizer, and broad-spectrum SPF 30+ sunscreen every morning.",
                    "tag": "Daily Maintenance"
                },
                {
                    "title": "Consistent Sunscreen Habit",
                    "action": "Apply sunscreen daily as the final morning step, regardless of cloud cover, to prevent cumulative solar photo-damage.",
                    "tag": "Photoprotection"
                }
            ]
        )
    ]

    return rules

