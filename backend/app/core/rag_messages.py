"""Canonical RAG fallback messages — single source of truth.

Three distinct failure types, each with a different juridical implication:

MSG_NO_SYSTEM      (Cause 1)  Infrastructure failure — Qdrant unreachable or empty.
MSG_OUT_OF_DOMAIN  (Cause 2-3) Question has no matching category / no dense chunks at all.
MSG_UNRELIABLE     (Cause 4-8) Chunks retrieved but confidence too low to give a safe answer.
"""

MSG_NO_SYSTEM = (
    "Aucune base documentaire n'est disponible. "
    "Contactez l'administrateur système."
)

MSG_OUT_OF_DOMAIN = (
    "Aucun texte juridique référencé dans le système ne couvre cette question. "
    "Veuillez reformuler ou vérifier que le sujet relève du domaine documenté."
)

MSG_UNRELIABLE = (
    "Les textes juridiques disponibles ne permettent pas d'apporter une réponse "
    "suffisamment fiable à cette question. "
    "Nous vous recommandons de consulter directement le texte de loi original "
    "ou de contacter un expert juridique."
)
