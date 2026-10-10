from collections import defaultdict
from datetime import datetime

from .schemas import AttendanceSnapshot, BiometricEvent

# The in-memory store is intentionally only for a local demo. Replace with PostgreSQL/Redis in deployment.
_events: list[BiometricEvent] = []


def add_events(events: list[BiometricEvent]) -> int:
    known = {event.event_id for event in _events}
    fresh = [event for event in events if event.event_id not in known]
    _events.extend(fresh)
    return len(fresh)


def calculate_expected(centre_id: str, batch_id: str, at_time: datetime | None = None) -> AttendanceSnapshot:
    cutoff = at_time or datetime.now().astimezone()
    active: set[str] = set()
    check_ins: set[str] = set()
    check_outs: set[str] = set()
    relevant = sorted(
        (event for event in _events if event.centre_id == centre_id and event.batch_id == batch_id and event.occurred_at <= cutoff),
        key=lambda event: event.occurred_at,
    )
    for event in relevant:
        if event.event_type == "CHECK_IN":
            active.add(event.trainee_ref)
            check_ins.add(event.trainee_ref)
        else:
            active.discard(event.trainee_ref)
            check_outs.add(event.trainee_ref)
    return AttendanceSnapshot(
        centre_id=centre_id,
        batch_id=batch_id,
        expected_present=len(active),
        checked_in=len(check_ins),
        checked_out=len(check_outs),
        calculated_at=cutoff,
    )
