import re
from datetime import UTC, datetime
from typing import Literal


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
        "entre les",
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

    def compute_legal_modifier(
        self,
        chunk: dict,
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> float:
        legal_status = str(chunk.get("legal_status", "actif")).strip().lower()
        recency_bonus = self._compute_recency_bonus(chunk)

        if query_mode == "future_preview":
            status_bonus = {
                "actif": 0.04,
                "futur": 0.1,
                "remplace": -0.02,
                "abroge": -0.08,
            }.get(legal_status, -0.03)
        elif query_mode == "comparison":
            status_bonus = {
                "actif": 0.06,
                "futur": 0.08,
                "remplace": 0.03,
                "abroge": -0.02,
            }.get(legal_status, -0.02)
        elif question_profile == "historical":
            status_bonus = {
                "actif": 0.04,
                "futur": -0.16,
                "remplace": 0.03,
                "abroge": 0.0,
            }.get(legal_status, -0.02)
        else:
            status_bonus = {
                "actif": 0.12,
                "futur": -0.3,
                "remplace": -0.06,
                "abroge": -0.14,
            }.get(legal_status, -0.03)

        return status_bonus + recency_bonus

    @staticmethod
    def _compute_recency_bonus(chunk: dict) -> float:
        date_value = chunk.get("date_entree_vigueur") or chunk.get("date_publication") or chunk.get("realized_at")
        if isinstance(date_value, str):
            try:
                date_value = datetime.fromisoformat(date_value.replace("Z", "+00:00"))
            except ValueError:
                return 0.0
        elif not isinstance(date_value, datetime):
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
