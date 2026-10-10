from .config import settings
from .schemas import ReconciliationRequest, ReconciliationResult


def reconcile(request: ReconciliationRequest) -> ReconciliationResult:
    tolerance = max(settings.tolerance_min_people, round(request.expected_present * settings.tolerance_percent))
    discrepancy = round(request.expected_present - request.observed_median, 1)

    if request.camera_quality_score < 0.55:
        return ReconciliationResult(
            status="CAMERA_UNHEALTHY",
            reason="Camera quality is too poor for defensible occupancy verification.",
            discrepancy=discrepancy,
            tolerance_people=tolerance,
        )
    if discrepancy <= 0:
        return ReconciliationResult(
            status="NO_DEFICIT_DETECTED",
            reason="Observed occupancy meets or exceeds the biometric expected count.",
            discrepancy=discrepancy,
            tolerance_people=tolerance,
        )
    if discrepancy <= tolerance:
        return ReconciliationResult(
            status="WITHIN_CAMERA_TOLERANCE",
            reason="The small gap is within the configured camera-count tolerance.",
            discrepancy=discrepancy,
            tolerance_people=tolerance,
        )
    if request.occlusion_risk == "high" or request.count_stability < 0.70 or request.detection_confidence < 0.60:
        return ReconciliationResult(
            status="UNVERIFIABLE",
            reason="A material gap exists, but occlusion or weak visual evidence prevents a defensible finding.",
            discrepancy=discrepancy,
            tolerance_people=tolerance,
        )
    return ReconciliationResult(
        status="REVIEW_REQUIRED",
        reason="A sustained occupancy gap exceeds tolerance and requires a human reviewer; it is not an automatic violation.",
        discrepancy=discrepancy,
        tolerance_people=tolerance,
    )
