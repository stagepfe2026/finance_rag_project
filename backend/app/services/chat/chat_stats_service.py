import logging
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from app.repositories.chat_repository import ChatRepository


class ChatStatsService:
    # Initialise le service avec le repository de chat.
    def __init__(self, chat_repository: ChatRepository) -> None:
        self.chat_repo = chat_repository
        self.logger = logging.getLogger(__name__)

    # Calcule et retourne les statistiques de feedback des messages du chat.
    def get_feedback_stats(self) -> dict[str, Any]:
        messages = self.chat_repo.list_with_feedback()
        likes = 0
        dislikes = 0
        signalement_responses = 0
        now = datetime.now(UTC)
        trend_buckets: dict[str, dict[str, Any]] = {}

        for offset in range(6, -1, -1):
            day = (now - timedelta(days=offset)).date()
            trend_buckets[day.isoformat()] = {
                "date": day.isoformat(),
                "label": day.strftime("%d/%m"),
                "likes": 0,
                "dislikes": 0,
                "signalements": 0,
            }

        documents: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "documentId": "",
                "documentName": "Document sans nom",
                "legalType": "",
                "category": "",
                "likes": 0,
                "dislikes": 0,
                "signalements": 0,
                "reportRate": 0.0,
            }
        )
        recent_dislikes: list[dict[str, Any]] = []

        for message in messages:
            feedback = message.feedback
            if feedback == "like":
                likes += 1
            elif feedback == "dislike":
                dislikes += 1

            normalized_sources = [source for source in message.sources if isinstance(source, dict)]
            document_sources = [
                source
                for source in normalized_sources
                if str(source.get("document_id", "")).strip() or str(source.get("document_name", "")).strip()
            ]
            is_document_signalement = feedback == "dislike" and bool(document_sources)

            if is_document_signalement:
                signalement_responses += 1

            feedback_at = message.feedback_at or message.created_at
            day_key = feedback_at.astimezone(UTC).date().isoformat()
            if day_key in trend_buckets:
                if feedback == "like":
                    trend_buckets[day_key]["likes"] += 1
                elif feedback == "dislike":
                    trend_buckets[day_key]["dislikes"] += 1
                    if is_document_signalement:
                        trend_buckets[day_key]["signalements"] += 1

            if feedback == "dislike":
                recent_dislikes.append(
                    {
                        "messageId": message.id or "",
                        "conversationId": message.conversation_id,
                        "content": self._truncate(message.content, 180),
                        "feedbackAt": feedback_at.astimezone(UTC).isoformat(),
                        "isSignalement": is_document_signalement,
                        "sources": [
                            {
                                "documentId": str(source.get("document_id", "")),
                                "documentName": str(source.get("document_name", "Document sans nom")),
                            }
                            for source in document_sources[:4]
                        ],
                    }
                )

            for source in document_sources:
                document_id = str(source.get("document_id", "")).strip()
                document_name = str(source.get("document_name", "")).strip()
                if not document_id and not document_name:
                    continue

                key = document_id or document_name
                item = documents[key]
                item["documentId"] = document_id
                item["documentName"] = document_name or "Document sans nom"
                item["legalType"] = str(source.get("legal_type", source.get("document_type", ""))).strip()
                item["category"] = str(source.get("category", "")).strip()
                if feedback == "like":
                    item["likes"] += 1
                elif feedback == "dislike":
                    item["dislikes"] += 1
                    item["signalements"] += 1

        document_items = []
        for item in documents.values():
            total_for_document = int(item["likes"]) + int(item["dislikes"])
            item["reportRate"] = round((int(item["dislikes"]) / total_for_document) * 100, 1) if total_for_document else 0.0
            document_items.append(item)

        document_items.sort(key=lambda item: (int(item["dislikes"]), int(item["likes"])), reverse=True)
        flagged_documents = [item for item in document_items if int(item["signalements"]) > 0]
        total_votes = likes + dislikes
        satisfaction_rate = round((likes / total_votes) * 100) if total_votes else 0
        most_flagged = flagged_documents[0] if flagged_documents else None

        distribution = []
        total_document_signalements = sum(int(item["signalements"]) for item in flagged_documents)
        for item in flagged_documents[:4]:
            count = int(item["signalements"])
            distribution.append(
                {
                    "documentName": item["documentName"],
                    "count": count,
                    "percentage": round((count / total_document_signalements) * 100) if total_document_signalements else 0,
                }
            )
        other_count = sum(int(item["signalements"]) for item in flagged_documents[4:])
        if other_count:
            distribution.append(
                {
                    "documentName": "Autres documents",
                    "count": other_count,
                    "percentage": round((other_count / total_document_signalements) * 100) if total_document_signalements else 0,
                }
            )

        return {
            "summary": {
                "reportedResponses": signalement_responses,
                "dislikesWithoutSource": max(0, dislikes - signalement_responses),
                "documentSignalements": total_document_signalements,
                "likes": likes,
                "dislikes": dislikes,
                "satisfactionRate": satisfaction_rate,
                "mostFlaggedDocument": {
                    "documentId": most_flagged["documentId"],
                    "documentName": most_flagged["documentName"],
                    "signalements": most_flagged["signalements"],
                }
                if most_flagged
                else None,
            },
            "trend": list(trend_buckets.values()),
            "quality": {
                "likes": likes,
                "dislikes": dislikes,
                "signalements": signalement_responses,
                "dislikesWithoutSource": max(0, dislikes - signalement_responses),
                "satisfactionRate": satisfaction_rate,
            },
            "documents": document_items[:10],
            "distribution": distribution,
            "recentDislikes": recent_dislikes[:8],
        }

    # Tronque un texte a la longueur maximale specifiee en preservant les mots.
    @staticmethod
    def _truncate(content: str, max_length: int) -> str:
        compact = " ".join(content.split())
        if len(compact) <= max_length:
            return compact
        return f"{compact[: max_length - 3].rstrip()}..."
