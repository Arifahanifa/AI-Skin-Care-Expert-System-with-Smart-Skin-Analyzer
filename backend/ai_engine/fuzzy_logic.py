"""
Fuzzy Logic Module for AI Skin Care Expert System.
Implements standard Zadeh fuzzy sets, triangular and trapezoidal membership functions,
fuzzy linguistic variables, and t-norm (min) / t-conorm (max) operations.
No Machine Learning or neural networks are used.
"""

def trapmf(x: float, a: float, b: float, c: float, d: float) -> float:
    """Trapezoidal membership function."""
    if x <= a or x >= d:
        return 0.0
    if a < x < b:
        return round((x - a) / (b - a), 3) if b > a else 1.0
    if b <= x <= c:
        return 1.0
    if c < x < d:
        return round((d - x) / (d - c), 3) if d > c else 1.0
    return 0.0


def trimf(x: float, a: float, b: float, c: float) -> float:
    """Triangular membership function."""
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if a < x < b:
        return round((x - a) / (b - a), 3) if b > a else 1.0
    if b < x < c:
        return round((c - x) / (c - b), 3) if c > b else 1.0
    return 0.0


class SkinFuzzyClassifier:
    """
    Fuzzy linguistic classifiers for skin parameters and environmental factors.
    Each variable maps a crisp numerical observation [0-100] (or domain-specific)
    into degrees of membership across linguistic terms: LOW, MEDIUM, HIGH.
    """

    @staticmethod
    def classify_hydration(val: float) -> dict:
        """
        Hydration scale [0 - 100]:
        LOW:    trapmf(val, -1, 0, 30, 45)
        MEDIUM: trimf(val, 30, 50, 70)
        HIGH:   trapmf(val, 55, 75, 100, 101)
        """
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 30, 45)
        med = trimf(val, 30, 50, 70)
        high = trapmf(val, 55, 75, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Hydration at {val}% exhibits {dominant} membership (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_oiliness(val: float) -> dict:
        """
        Oiliness scale [0 - 100]:
        LOW:    trapmf(val, -1, 0, 25, 40)
        MEDIUM: trimf(val, 30, 50, 70)
        HIGH:   trapmf(val, 60, 75, 100, 101)
        """
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 25, 40)
        med = trimf(val, 30, 50, 70)
        high = trapmf(val, 60, 75, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Sebum/Oiliness at {val}% classifies predominantly as {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_sensitivity(val: float) -> dict:
        """
        Sensitivity scale [0 - 100]:
        LOW:    trapmf(val, -1, 0, 25, 38)
        MEDIUM: trimf(val, 28, 50, 68)
        HIGH:   trapmf(val, 55, 75, 100, 101)
        """
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 25, 38)
        med = trimf(val, 28, 50, 68)
        high = trapmf(val, 55, 75, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Sensory reactivity at {val}% classifies as {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_redness(val: float) -> dict:
        """
        Redness scale [0 - 100]:
        LOW:    trapmf(val, -1, 0, 20, 35)
        MEDIUM: trimf(val, 25, 48, 65)
        HIGH:   trapmf(val, 50, 70, 100, 101)
        """
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 20, 35)
        med = trimf(val, 25, 48, 65)
        high = trapmf(val, 50, 70, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Erythema/Redness at {val}% classifies as {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_acne_concern(val: float) -> dict:
        """
        Acne concern scale [0 - 100]:
        LOW:    trapmf(val, -1, 0, 20, 35)
        MEDIUM: trimf(val, 25, 50, 70)
        HIGH:   trapmf(val, 55, 75, 100, 101)
        """
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 20, 35)
        med = trimf(val, 25, 50, 70)
        high = trapmf(val, 55, 75, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Acne comedonal concern at {val}% is {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_dryness(val: float) -> dict:
        """Dryness scale [0 - 100]"""
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 25, 40)
        med = trimf(val, 30, 50, 70)
        high = trapmf(val, 55, 75, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Cutaneous dryness at {val}% is {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_irritation(val: float) -> dict:
        """Irritation scale [0 - 100]"""
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 20, 35)
        med = trimf(val, 25, 48, 65)
        high = trapmf(val, 50, 70, 100, 101)
        memberships = {"LOW": low, "MEDIUM": med, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Irritation discomfort at {val}% is {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_uv_index(val: float) -> dict:
        """
        UV Index [0 - 12+]:
        LOW: trapmf(val, -1, 0, 2.5, 3.5)
        MODERATE: trimf(val, 2.5, 5.0, 7.5)
        HIGH: trimf(val, 5.5, 8.0, 10.0)
        EXTREME: trapmf(val, 8.5, 10.5, 15, 20)
        """
        val = max(0.0, float(val))
        low = trapmf(val, -1, 0, 2.5, 3.5)
        mod = trimf(val, 2.5, 5.0, 7.5)
        high = trimf(val, 5.5, 8.0, 10.0)
        extreme = trapmf(val, 8.5, 10.5, 15, 20)
        memberships = {"LOW": low, "MODERATE": mod, "HIGH": high, "EXTREME": extreme}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Environmental UV index {val} is {dominant} (μ={memberships[dominant]:.2f})"
        }

    @staticmethod
    def classify_humidity(val: float) -> dict:
        """Humidity [0 - 100%]"""
        val = max(0.0, min(100.0, float(val)))
        low = trapmf(val, -1, 0, 30, 42)
        optimal = trimf(val, 38, 55, 70)
        high = trapmf(val, 65, 80, 100, 101)
        memberships = {"LOW": low, "OPTIMAL": optimal, "HIGH": high}
        dominant = max(memberships, key=memberships.get)
        return {
            "value": val,
            "memberships": memberships,
            "dominant": dominant,
            "degree": memberships[dominant],
            "description": f"Ambient humidity {val}% is {dominant} (μ={memberships[dominant]:.2f})"
        }


def evaluate_fuzzy_conjunction(*degrees: float) -> float:
    """
    Zadeh's t-norm operator for AND conjunction:
    μ(A ∩ B) = min(μ_A, μ_B)
    """
    if not degrees:
        return 0.0
    return round(min(degrees), 3)


def evaluate_fuzzy_disjunction(*degrees: float) -> float:
    """
    Zadeh's t-conorm operator for OR disjunction:
    μ(A ∪ B) = max(μ_A, μ_B)
    """
    if not degrees:
        return 0.0
    return round(max(degrees), 3)
