from typing import Literal


class PromptBuilderService:
    def build_context(self, chunks: list[dict]) -> str:
        context_parts: list[str] = []

        for idx, chunk in enumerate(chunks, start=1):
            context_parts.append(
                "\n".join(
                    [
                        f"Titre: {chunk.get('document_title') or chunk.get('document_name') or 'Document'}",
                        f"Categorie: {chunk.get('category', '')}",
                        f"Type juridique: {chunk.get('document_type_label') or chunk.get('document_type', '')}",
                        f"Statut juridique: {chunk.get('legal_status', 'actif')}",
                        f"Date publication: {self._format_value(chunk.get('date_publication'))}",
                        f"Date entree en vigueur: {self._format_value(chunk.get('date_entree_vigueur'))}",
                        f"Version: {self._format_value(chunk.get('version'))}",
                        f"Relation: {self._build_relation_label(chunk)}",
                        f"Priorite d'application: {self._build_applicability_label(chunk)}",
                        self._build_future_warning(chunk),
                        f"Nom du texte: {chunk.get('document_name', '')}",
                        f"Extrait juridique: {chunk.get('text', '')}",
                    ]
                )
            )

        return "\n\n---\n\n".join(context_parts)

    def build_prompt(
        self,
        *,
        question: str,
        context: str,
        response_mode: Literal["short", "detailed"],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> str:
        response_instruction = (
            "Donne une reponse courte, directe et precise en 3 a 5 lignes maximum."
            if response_mode == "short"
            else "Donne une reponse detaillee, structuree et pedagogique en t appuyant uniquement sur les sources fournies."
        )

        profile_instruction = {
            "current": (
                "Privilegie le texte actif le plus pertinent. "
                "Ne presente jamais un texte futur, remplace ou abroge comme la regle actuelle."
            ),
            "historical": (
                "Tu peux utiliser des textes anciens, remplaces ou abroges si la question porte sur l historique. "
                "Indique clairement quand une regle appartient a une ancienne version."
            ),
            "comparative": (
                "Compare les versions si plusieurs textes sont fournis. "
                "Explique ce qui a change, quel texte remplace ou abroge l autre, et lequel est actif."
            ),
        }.get(question_profile, "")

        query_mode_instruction = {
            "current": (
                "Mode current: reponds uniquement avec les documents deja en vigueur. "
                "Si le contexte contient un document futur, indique qu il ne fonde pas la reponse actuelle."
            ),
            "future_preview": (
                "Mode future_preview: tu peux expliquer les textes futurs. "
                "Si tu utilises un document futur, ajoute l avertissement suivant en remplacant [date] par sa date d entree en vigueur: "
                "⚠️ This legal document is not yet in force. It will be applicable from [date]."
            ),
            "comparison": (
                "Mode comparison: compare le document selectionne et son document lie lorsque les deux sont fournis. "
                "Structure toujours la comparaison dans un tableau Markdown clair. "
                "Si un document futur est utilise, ajoute l avertissement suivant en remplacant [date] par sa date d entree en vigueur: "
                "⚠️ This legal document is not yet in force. It will be applicable from [date]."
            ),
        }.get(query_mode, "")

        comparison_and_stats_instruction = (
            "Si la question demande une comparaison ou contient des informations statistiques, structure la reponse avec un tableau Markdown propre. "
            "Quand des donnees numeriques sont presentes, inclus les valeurs numeriques dans des colonnes dediees afin que l interface puisse generer un graphique. "
            "Ajoute ensuite une courte synthese analytique fondee uniquement sur les donnees du tableau. "
            "S il n y a aucune donnee numerique, fournis uniquement le tableau de comparaison."
        )

        legal_priority_instruction = (
            "Regles de priorite juridique obligatoires: "
            "Avant de repondre, verifie le Statut juridique, la Date entree en vigueur, la Version et la Relation de chaque source. "
            "Si une source active et une source remplacee traitent le meme sujet, reponds d abord avec la source active. "
            "Ne commence jamais la reponse par une source remplacee si une source active pertinente existe. "
            "Un texte remplace ou abroge ne doit jamais etre presente comme la regle actuellement applicable. "
            "Utilise un texte remplace uniquement pour expliquer l historique ou la difference avec le texte actif. "
            "Si tu utilises un texte remplace, indique clairement qu il n est plus la reference principale. "
            "Si seules des sources remplacees ou abrogees sont disponibles, reponds prudemment et precise que l information ne vient pas d un texte actuellement applicable. "
            "Pour une question sur la regle actuelle, formule d abord la reponse autour du texte actuellement applicable, puis mentionne l ancien texte seulement si c est utile."
        )

        return f"""
Tu es un assistant juridique specialise en recherche documentaire.
Tu dois repondre uniquement a partir du contexte fourni.
N'ajoute aucune information absente du contexte.
{response_instruction}
{profile_instruction}
{query_mode_instruction}
{comparison_and_stats_instruction}
{legal_priority_instruction}
Si une source est future, remplacee ou abrogee, signale-le explicitement.
S il existe un conflit entre plusieurs textes, privilegie la source la plus pertinente juridiquement et explique ta prudence.
Si l'information n'apparait pas clairement dans le contexte, reponds exactement :
Après analyse des documents disponibles dans le système, aucune information pertinente n’a pu être identifiée pour répondre à cette question. 
Il est possible que la formulation nécessite d’être précisée..

Contexte:
{context}

Question:
{question}

Reponse:
""".strip()

    @staticmethod
    def _format_value(value: object) -> str:
        if value is None:
            return "-"
        return str(value) if str(value).strip() else "-"

    @staticmethod
    def _build_relation_label(chunk: dict) -> str:
        relation_type = str(chunk.get("relation_type", "none")).strip()
        related_document_id = str(chunk.get("related_document_id", "")).strip()
        related_document_title = str(chunk.get("related_document_title", "")).strip()
        legal_status = str(chunk.get("legal_status", "actif")).strip()

        if relation_type in {"", "none"}:
            return "-"

        related_part = related_document_title or related_document_id or "document lie"
        if relation_type == "remplace":
            if legal_status == "remplace":
                return f"Ce document est remplace par: {related_part}"
            return f"Ce document remplace: {related_part}"

        if relation_type == "abroge":
            if legal_status == "abroge":
                return f"Ce document est abroge par: {related_part}"
            return f"Ce document abroge: {related_part}"

        return f"{relation_type} -> {related_part}"

    @staticmethod
    def _build_applicability_label(chunk: dict) -> str:
        legal_status = str(chunk.get("legal_status", "actif")).strip()
        if legal_status == "actif":
            return "Texte actuellement applicable; utiliser en priorite pour la regle actuelle."
        if legal_status == "remplace":
            return "Ancien texte remplace; utiliser seulement comme historique si une source active existe."
        if legal_status == "abroge":
            return "Texte abroge; ne pas presenter comme regle actuelle."
        if legal_status == "futur":
            return "Texte futur; ne pas utiliser comme regle actuelle avant sa date d entree en vigueur."
        return "Statut a verifier avant utilisation."

    @classmethod
    def _build_future_warning(cls, chunk: dict) -> str:
        if str(chunk.get("legal_status", "")).strip() != "futur":
            return "Avertissement: -"
        effective_date = cls._format_value(chunk.get("date_entree_vigueur"))
        return (
            "Avertissement: ⚠️ This legal document is not yet in force. "
            f"It will be applicable from {effective_date}."
        )
