from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BiometricEvent(BaseModel):
    event_id: str
    centre_id: str
    batch_id: str
    trainee_ref: str = Field(description="Tokenised local trainee reference; never Aadhaar number.")
    event_type: Literal["CHECK_IN", "CHECK_OUT"]
    occurred_at: datetime
    device_id: str
    source: str = "DEMO"


class AttendanceSnapshot(BaseModel):
    centre_id: str
    batch_id: str
    expected_present: int
    checked_in: int
    checked_out: int
    calculated_at: datetime


class ReconciliationRequest(BaseModel):
    centre_id: str
    batch_id: str
    observation_id: str
    expected_present: int = Field(ge=0)
    observed_median: float = Field(ge=0)
    detection_confidence: float = Field(ge=0, le=1)
    camera_quality_score: float = Field(ge=0, le=1)
    count_stability: float = Field(ge=0, le=1)
    occlusion_risk: Literal["low", "medium", "high"] = "medium"


class ReconciliationResult(BaseModel):
    status: Literal[
        "NO_DEFICIT_DETECTED",
        "WITHIN_CAMERA_TOLERANCE",
        "UNVERIFIABLE",
        "CAMERA_UNHEALTHY",
        "REVIEW_REQUIRED",
    ]
    reason: str
    discrepancy: float
    tolerance_people: int
