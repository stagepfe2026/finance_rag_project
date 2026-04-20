from datetime import UTC, datetime
import re


class LegalRankingService:
    CURRENT_MARKERS = {
        "actuel",
        "actuelle",
        "en vigueur",
        "aujourd hui",
        "maintenant",
        "applicable",
        "version actuelle",
    }
    HISTORICAL_MARKERS = {
        "ancien",
        "ancienne",
        "avant",
        "historique",
        "precedente version",
        "ancien montant",
        "etait",
        "était",
        "version 2019",
        "loi 2019",
    }
    COMPARATIVE_MARKERS = {
        "qu est ce qui a change",
        "qu'est ce qui a change",
        "difference",
        "différence",
        "compare",
        "comparer",
        "comparaison",
        "remplace",
        "modifie",
        "entre la loi",
        "entre les deux",
    }

    def detect_question_profile(self, question: str) -> str:
        lowered_question = question.lower()
        years = re.findall(r"\b(?:19|20)\d{2}\b", lowered_question)
        if len(years) >= 2:
            return "comparative"
        if any(marker in lowered_question for marker in self.COMPARATIVE_MARKERS):
            return "comparative"
        if any(marker in lowered_question for marker in self.HISTORICAL_MARKERS):
            return "historical"
        if any(marker in lowered_question for marker in self.CURRENT_MARKERS):
            return "current"
        return "current"

    def compute_legal_modifier(self, chunk: dict, question_profile: str) -> float:
        legal_status = str(chunk.get("legal_status", "inconnu")).strip().lower()
        recency_bonus = self._compute_recency_bonus(chunk)

        if question_profile == "current":
            status_bonus = {
                "en_vigueur": 0.08,
                "modifie": 0.01,
                "remplace": -0.07,
                "abroge": -0.1,
                "inconnu": -0.01,
            }.get(legal_status, -0.01)
        elif question_profile == "historical":
            status_bonus = {
                "en_vigueur": 0.02,
                "modifie": 0.03,
                "remplace": 0.01,
                "abroge": 0.0,
                "inconnu": 0.0,
            }.get(legal_status, 0.0)
        else:
            status_bonus = {
                "en_vigueur": 0.04,
                "modifie": 0.04,
                "remplace": 0.01,
                "abroge": -0.02,
                "inconnu": 0.0,
            }.get(legal_status, 0.0)

        return status_bonus + recency_bonus

    @staticmethod
    def _compute_recency_bonus(chunk: dict) -> float:
        date_value = chunk.get("date_entree_vigueur") or chunk.get("date_publication") or chunk.get("realized_at")
        if not isinstance(date_value, datetime):
            return 0.0

        now = datetime.now(UTC)
        normalized_date = date_value if date_value.tzinfo else date_value.replace(tzinfo=UTC)
        age_days = max((now - normalized_date).days, 0)

        if age_days <= 365:
            return 0.03
        if age_days <= 3 * 365:
            return 0.015
        if age_days <= 6 * 365:
            return 0.005
        return 0.0
