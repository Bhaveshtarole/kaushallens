export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type CaseStatus = 'open' | 'under_review' | 'awaiting_centre_response' | 'escalated' | 'resolved' | 'closed'
export type Category = 'attendance' | 'infrastructure' | 'camera_health' | 'connectivity'
export type ComplianceStatus = 'Compliant' | 'Potential discrepancy' | 'Unverifiable' | 'Camera unhealthy' | 'Manual verification required' | 'Needs Review' | 'Camera Issue'
export type Centre = { id:string; name:string; state:string; district:string; status:ComplianceStatus; score:number; attendanceMatch?:number; infrastructureScore?:number; openCases:number; camerasHealthy:number; camerasTotal:number; lastSync:string; risk:string }
export type Camera = { id:string; room:string; status:'healthy'|'offline'|'blurred'|'obstructed'|'dark'|'frozen stream'; quality:number; lastSync:string; edgeStatus:string; people:number }
export type Batch = { id:string; name:string; trade:string; schedule:string; reported:number; observed:number; status:ComplianceStatus }
export type ComplianceCase = { id:string; title:string; category:Category; severity:Severity; status:CaseStatus; centreId:string; centreName:string; state:string; district:string; roomName?:string; batchName?:string; expectedValue?:number; observedValue?:number; confidence:number; evidenceQuality:'high'|'medium'|'low'; triggerReason:string; createdAt:string; updatedAt:string; assignedTo?:string; slaDueAt:string; evidenceIds:string[] }
export type DashboardSummary = { centres:Centre[]; cases:ComplianceCase[]; attendanceTrend:{day:string; reported?:number; observed?:number; discrepancies:number}[]; severity:{name:string;value:number;fill:string}[]; totals:{activeCentres:number; camerasHealthy:number; camerasTotal:number; activeBatches:number; openCases:number; criticalAlerts:number; offlineCentres:number} }
export type InventoryItem = { item:string; room:string; expected:number; observed:number; status:ComplianceStatus }
export type CentreDetail = Centre & { address:string; manager:string; batches:Batch[]; cameras:Camera[]; inventory:InventoryItem[]; timeline:{date:string; text:string; tone:string}[] }
export type AuditLog = { id:string; action:string; actor:string; at:string }
export type User = { id:string; name:string; role:string }
export type AttendanceRecord = { day:string; batch:string; reported:number; observed:number; variance:number }
export type EvidenceAsset = { id:string; label:string; quality:string; hash:string }
export type CaseReview = { id:string; action:string; actor:string; at:string; note?:string }
export type Room = { id:string; name:string; area:number }
export type EdgeDevice = { id:string; version:string; storage:number; status:string }
export type Observation = { id:string; value:number; quality:string; at:string }

// ── Biometric-to-Video Attendance Reconciliation ──
export type ReconciliationStatus =
  | 'NO_DEFICIT_DETECTED'
  | 'WITHIN_CAMERA_TOLERANCE'
  | 'UNVERIFIABLE'
  | 'CAMERA_UNHEALTHY'
  | 'REVIEW_REQUIRED'
  | 'CONFIRMED_BY_REVIEWER'
  | 'DISMISSED_BY_REVIEWER'

export type ReconciliationComplianceStatus = ReconciliationStatus

export type AttendanceReconciliation = {
  id: string
  centreId: string
  centreName: string
  batchId: string
  batchName: string
  roomName: string
  observedAt: string
  expectedPresent: number
  biometricCheckIns: number
  biometricCheckOuts: number
  observedMedian: number
  cameraQualityScore: number
  detectionConfidence: number
  countStability: number
  occlusionRisk: 'low' | 'medium' | 'high'
  status: ReconciliationStatus
  reason: string
  evidence: { type: 'snapshot' | 'clip'; url: string; capturedAt: string; observedOccupancy?: number; evidenceQuality?: string }[]
  reviewer?: { name: string; decision: 'CONFIRMED' | 'DISMISSED'; note: string; decidedAt: string }
  state: string
  district: string
  observedMax?: number
  auditTrail?: { action: string; performedBy: string; timestamp: string; details: string }[]
}

export type BiometricDevice = {
  id: string
  centreId: string
  centreName: string
  source: 'AEBAS' | 'RFID' | 'FINGERPRINT_VENDOR' | 'DEMO'
  lastSuccessfulSync: string
  delayedEvents: number
  offlineEvents: number
  health: 'healthy' | 'delayed' | 'offline'
  state: string
  district: string
}

export type BiometricEvent = {
  id: string
  tokenisedTraineeRef: string
  source: 'AEBAS' | 'RFID' | 'FINGERPRINT_VENDOR' | 'DEMO'
  deviceId: string
  eventType: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  centreId: string
  batchId: string
  syncStatus: 'synced' | 'pending' | 'failed'
  createdAt: string
}

export type VideoAnalysisJob = {
  id: string
  centreId: string
  batchId: string
  videoRef: string
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  result?: { observedMedian: number; detectionConfidence: number; countStability: number; occlusionRisk: 'low' | 'medium' | 'high' }
  submittedAt: string
  completedAt?: string
}

export type ColabBoundingBox = {
  track_id: number
  confidence: number
  box: [number, number, number, number] // [x1, y1, x2, y2]
}

export type ColabSample = {
  time_seconds: number
  visible_tracked_people: number
  mean_detection_confidence: number
  camera_quality_score: number
  camera_quality_status: string
  camera_quality_flags: string
  brightness: number
  blur_variance: number
  active_track_ids: string
  boxes?: ColabBoundingBox[]
}

export type ColabWindow = {
  window_id: number
  start_time_seconds: number
  end_time_seconds: number
  observed_median: number
  observed_mean: number
  observed_min: number
  observed_max: number
  detection_confidence: number
  camera_quality_score: number
  count_stability: number
  reported_attendance: number
  compliance_status: string
  reason: string
}

export type ColabEvent = {
  event_id: string
  event_type: string
  centre_id: string
  camera_id: string
  batch_id: string
  window_start_seconds: number
  window_end_seconds: number
  reported_attendance: number
  observed_median_visible_people: number
  camera_quality_score: number
  detection_confidence: number
  count_stability: number
  occlusion_risk: string
  reason: string
  review_required: boolean
  generated_at_utc: string
}

export type ColabRunPackage = {
  observation_id: string
  centre_id: string
  batch_id: string
  camera_id?: string
  video: {
    filename: string
    fps: number
    total_frames: number
    resolution?: string
    duration_seconds?: number
  }
  summary: {
    expected_present: number
    observed_median: number
    observed_mean?: number
    observed_min?: number
    observed_max?: number
    sample_count: number
    detection_confidence: number
    camera_quality_score: number
    count_stability: number
    occlusion_risk: string
    unique_tracks?: number
  }
  decision: {
    status: string
    reason: string
    discrepancy: number
    tolerance_people: number
  }
  windows: ColabWindow[]
  events: ColabEvent[]
  samples: ColabSample[]
  timeline?: ColabSample[]
  annotated_video_url?: string
  run_package?: {
    run_metadata: Record<string, any>
    events: ColabEvent[]
  }
}

