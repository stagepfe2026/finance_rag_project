from datetime import UTC, datetime, timedelta

from app.models.reclamation_model import ReclamationModel


class ReclamationSlaService:
    # SLA deadlines in minutes (calendar time)
    SLA_MINUTES: dict[str, int] = {
        "URGENT": 4 * 60,        # 4h
        "HIGH": 24 * 60,         # 1 day
        "NORMAL": 3 * 24 * 60,   # 3 days
        "LOW": 7 * 24 * 60,      # 7 days
    }
    # DUE_SOON threshold: URGENT = last hour, others = last quarter of delay
    DUE_SOON_MINUTES: dict[str, int] = {
        "URGENT": 60,
        "HIGH": 360,
        "NORMAL": 1080,
        "LOW": 2520,
    }

    def __init__(self) -> None:
        pass

    def compute_sla(self, reclamation: ReclamationModel) -> dict:
        sla_minutes = self.SLA_MINUTES.get(reclamation.priority, self.SLA_MINUTES["NORMAL"])
        due_soon_minutes = self.DUE_SOON_MINUTES.get(reclamation.priority, self.DUE_SOON_MINUTES["NORMAL"])

        deadline = reclamation.created_at + timedelta(minutes=sla_minutes)

        # Backward compat: legacy docs without firstHandledAt already in progress/resolved/failed
        first_handled = reclamation.first_handled_at
        if first_handled is None and reclamation.status in ("IN_PROGRESS", "RESOLVED", "FAILED"):
            first_handled = reclamation.updated_at

        if first_handled is not None:
            if first_handled <= deadline:
                sla_status = "COMPLETED_ON_TIME"
            else:
                sla_status = "COMPLETED_LATE"
            delay = max(0, int((first_handled - deadline).total_seconds() / 60))
            return {
                "slaDeadlineAt": deadline.isoformat(),
                "slaStatus": sla_status,
                "slaRemainingMinutes": None,
                "slaDelayMinutes": delay,
                "isSlaOverdue": sla_status == "COMPLETED_LATE",
            }

        now = datetime.now(UTC)
        remaining_seconds = (deadline - now).total_seconds()
        if remaining_seconds <= 0:
            return {
                "slaDeadlineAt": deadline.isoformat(),
                "slaStatus": "OVERDUE",
                "slaRemainingMinutes": 0,
                "slaDelayMinutes": int(-remaining_seconds / 60),
                "isSlaOverdue": True,
            }
        remaining_minutes = int(remaining_seconds / 60)
        sla_status = "DUE_SOON" if remaining_minutes <= due_soon_minutes else "ON_TIME"
        return {
            "slaDeadlineAt": deadline.isoformat(),
            "slaStatus": sla_status,
            "slaRemainingMinutes": remaining_minutes,
            "slaDelayMinutes": 0,
            "isSlaOverdue": False,
        }
