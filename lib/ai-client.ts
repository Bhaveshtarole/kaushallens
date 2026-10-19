/**
 * SkillGuard AI Service Client
 * Server-side only — called from Next.js API route handlers, NEVER from the browser/client.
 * Communicates with the local FastAPI microservice running RF-DETR + ByteTrack + Compliance Engine.
 *
 * Privacy Invariant:
 * Never sends Aadhaar number, fingerprint data, iris data, biometric templates, or PID data.
 * Only sends tokenised trainee references (e.g. TR-MH-4201) and attendance event metadata.
 */

import type { AttendanceReconciliation, ReconciliationStatus } from './types'

const AI_BASE_URL = process.env.SKILLGUARD_AI_BASE_URL || 'http://127.0.0.1:8000'
const AI_ENABLED = process.env.SKILLGUARD_AI_ENABLED === 'true'
const VIDEO_TIMEOUT_MS = 120_000 // 120-second timeout for video analysis
const DEFAULT_TIMEOUT_MS = 5_000

export type AIHealth = {
  status: 'ok' | 'offline' | 'disabled'
  device?: string
  service?: string
  baseUrl: string
  enabled: boolean
  error?: string
}

export type AIAttendanceSnapshot = {
  centre_id: string
  batch_id: string
  expected_present: number
  checked_in: number
  checked_out: number
  calculated_at: string
}

export type BiometricEventInput = {
  eventId?: string
  event_id?: string
  centreId?: string
  centre_id?: string
  batchId?: string
  batch_id?: string
  traineeRef?: string
  trainee_ref?: string
  eventType?: 'CHECK_IN' | 'CHECK_OUT'
  event_type?: 'CHECK_IN' | 'CHECK_OUT'
  occurredAt?: string
  occurred_at?: string
  deviceId?: string
  device_id?: string
  source?: string
  // Safety: explicitly disallow PII
  aadhaar?: never
  fingerprint?: never
  iris?: never
  biometricTemplate?: never
}

export type VideoJobInput = {
  videoFile?: Blob | File
  videoBuffer?: Buffer
  videoFilename?: string
  centreId: string
  batchId: string
  expectedPresent: number
  occlusionRisk?: 'low' | 'medium' | 'high'
}

export type VideoAnalysisResult = {
  reconciliation: AttendanceReconciliation
  aiDevice?: string
  isDemoFallback: boolean
  rawAiResponse?: unknown
  message?: string
}

/** Internal fetch helper with configurable abort timeout */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Check health of the local AI model service (FastAPI)
 * GET /health
 */
export async function getAIHealth(): Promise<AIHealth> {
  if (!AI_ENABLED) {
    return {
      status: 'disabled',
      device: 'none',
      service: 'skillguard-local-ai (disabled in .env.local)',
      baseUrl: AI_BASE_URL,
      enabled: false,
    }
  }

  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/health`, {}, 4_000)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const json = (await res.json()) as { status: string; device: string; service: string }
    return {
      status: json.status === 'ok' ? 'ok' : 'offline',
      device: json.device || 'cpu',
      service: json.service || 'skillguard-local-ai',
      baseUrl: AI_BASE_URL,
      enabled: true,
    }
  } catch (err: any) {
    return {
      status: 'offline',
      device: 'unreachable',
      service: 'skillguard-local-ai',
      baseUrl: AI_BASE_URL,
      enabled: true,
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Cannot connect to 127.0.0.1:8000',
    }
  }
}

/**
 * Forward normalised, tokenised biometric check-in/check-out events to:
 * POST {AI_BASE_URL}/v1/attendance/events
 * Strips any sensitive fields before forwarding.
 */
export async function forwardBiometricEvents(events: BiometricEventInput[]): Promise<{
  success: boolean
  accepted?: number
  received?: number
  isFallback: boolean
  message: string
}> {
  // Privacy invariant: Sanitize and strictly map only permissible non-biometric metadata
  const sanitized = events.map((e, idx) => ({
    event_id: e.event_id || e.eventId || `evt-${Date.now()}-${idx}`,
    centre_id: e.centre_id || e.centreId || 'TC-MH-0042',
    batch_id: e.batch_id || e.batchId || 'BATCH-DEMO-101',
    trainee_ref: e.trainee_ref || e.traineeRef || `TR-${idx + 1000}`,
    event_type: (e.event_type || e.eventType || 'CHECK_IN') as 'CHECK_IN' | 'CHECK_OUT',
    occurred_at: e.occurred_at || e.occurredAt || new Date().toISOString(),
    device_id: e.device_id || e.deviceId || 'DEV-PUN-01',
    source: e.source || 'DEMO',
  }))

  if (!AI_ENABLED) {
    return {
      success: true,
      accepted: sanitized.length,
      received: sanitized.length,
      isFallback: true,
      message: 'AI service disabled — demo events accepted locally.',
    }
  }

  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/attendance/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const json = await res.json()
    return {
      success: true,
      accepted: json.accepted,
      received: json.received,
      isFallback: false,
      message: 'Biometric events synced to local AI service.',
    }
  } catch (err: any) {
    console.warn('[ai-client] Biometric events forward failed; using fallback:', err.message)
    return {
      success: true,
      accepted: sanitized.length,
      received: sanitized.length,
      isFallback: true,
      message: 'AI service unavailable — events recorded locally (fallback mode).',
    }
  }
}

/**
 * Forward attendance lookup to:
 * GET {AI_BASE_URL}/v1/attendance/{centreId}/{batchId}
 */
export async function getAIAttendance(centreId: string, batchId: string): Promise<AIAttendanceSnapshot | null> {
  if (!AI_ENABLED) return null
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/attendance/${centreId}/${batchId}`)
    if (!res.ok) return null
    return (await res.json()) as AIAttendanceSnapshot
  } catch (err: any) {
    console.warn('[ai-client] AIAttendance fetch failed:', err.message)
    return null
  }
}

/**
 * Forward video analysis to:
 * POST {AI_BASE_URL}/v1/analysis/video
 * Multipart form data with 120-second timeout.
 * Transforms response into frontend AttendanceReconciliation model.
 */
export async function analyzeVideoWithAI(input: VideoJobInput): Promise<VideoAnalysisResult> {
  const { centreId, batchId, expectedPresent, occlusionRisk = 'medium' } = input

  if (!AI_ENABLED) {
    return createDemoFallbackReconciliation(centreId, batchId, expectedPresent, occlusionRisk, 'AI service is disabled in .env.local')
  }

  try {
    // Construct multipart form data
    const formData = new FormData()
    formData.append('centre_id', centreId)
    formData.append('batch_id', batchId)
    formData.append('expected_present', String(expectedPresent))
    formData.append('occlusion_risk', occlusionRisk)

    if (input.videoFile) {
      formData.append('video', input.videoFile, input.videoFilename || 'classroom_sample.mp4')
    } else if (input.videoBuffer) {
      const blob = new Blob([new Uint8Array(input.videoBuffer)], { type: 'video/mp4' })
      formData.append('video', blob, input.videoFilename || 'classroom_sample.mp4')
    } else {
      throw new Error('No video file provided for analysis')
    }

    const res = await fetchWithTimeout(
      `${AI_BASE_URL}/v1/analysis/video`,
      {
        method: 'POST',
        body: formData,
      },
      VIDEO_TIMEOUT_MS
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`AI service returned HTTP ${res.status}: ${errText || res.statusText}`)
    }

    const json = (await res.json()) as {
      observation_id: string
      centre_id: string
      batch_id: string
      summary: {
        expected_present: number
        observed_median: number
        observed_max: number
        sample_count: number
        detection_confidence: number
        camera_quality_score: number
        count_stability: number
        occlusion_risk: 'low' | 'medium' | 'high'
      }
      decision: {
        status: ReconciliationStatus
        reason: string
        discrepancy: number
        tolerance_people: number
      }
      samples?: Array<{
        time_seconds: number
        visible_tracked_people: number
        mean_detection_confidence: number
        camera_quality_score: number
      }>
    }

    const reconciliation: AttendanceReconciliation = {
      id: `REC-${json.observation_id.slice(-6).toUpperCase()}`,
      centreId: json.centre_id,
      centreName: getCentreName(json.centre_id),
      state: 'Maharashtra',
      district: 'Pune',
      batchId: json.batch_id,
      batchName: `${json.batch_id} · CNC Operator`,
      roomName: 'Workshop Lab 1',
      observedAt: new Date().toISOString(),
      expectedPresent: json.summary.expected_present,
      biometricCheckIns: json.summary.expected_present,
      biometricCheckOuts: 0,
      observedMedian: Math.round(json.summary.observed_median),
      observedMax: json.summary.observed_max,
      cameraQualityScore: json.summary.camera_quality_score,
      detectionConfidence: json.summary.detection_confidence,
      countStability: json.summary.count_stability,
      occlusionRisk: json.summary.occlusion_risk,
      status: json.decision.status,
      reason: json.decision.reason,
      evidence: [
        {
          type: 'snapshot',
          url: '/placeholder.jpg',
          capturedAt: new Date().toISOString(),
          observedOccupancy: Math.round(json.summary.observed_median),
          evidenceQuality: json.summary.camera_quality_score > 0.7 ? 'high' : 'medium',
        },
      ],
      auditTrail: [
        {
          action: 'AI_VIDEO_ANALYSIS_COMPLETED',
          performedBy: 'SkillGuard Local AI (RF-DETR + ByteTrack)',
          timestamp: new Date().toISOString(),
          details: `Observed median: ${json.summary.observed_median}, expected: ${json.summary.expected_present}, decision: ${json.decision.status}`,
        },
      ],
    }

    return {
      reconciliation,
      aiDevice: 'cpu',
      isDemoFallback: false,
      rawAiResponse: json,
      message: `Analysis completed by local AI service (${json.decision.status})`,
    }
  } catch (err: any) {
    console.error('[ai-client] Video analysis failed, falling back:', err.message)
    return createDemoFallbackReconciliation(
      centreId,
      batchId,
      expectedPresent,
      occlusionRisk,
      `AI service unavailable (${err.message}) — demo data shown`
    )
  }
}

function getCentreName(centreId: string): string {
  const map: Record<string, string> = {
    'TC-MH-0042': 'Pune Skill Development Centre',
    'CTR-001': 'Pune Skill Development Centre',
    'CTR-002': 'Nashik Skill Development Centre',
    'CTR-003': 'Lucknow Skill Development Centre',
    'CTR-006': 'Mysuru Skill Development Centre',
    'CTR-012': 'Nagpur Skill Development Centre',
  }
  return map[centreId] || `${centreId} Vocational Centre`
}

/** Fallback generator when AI service is offline or disabled */
function createDemoFallbackReconciliation(
  centreId: string,
  batchId: string,
  expectedPresent: number,
  occlusionRisk: 'low' | 'medium' | 'high',
  fallbackReason: string
): VideoAnalysisResult {
  // Crowded classroom simulation: if high occlusion risk, video median undercounts -> UNVERIFIABLE
  let observedMedian = expectedPresent
  let status: ReconciliationStatus = 'WITHIN_CAMERA_TOLERANCE'
  let reason = 'Observed occupancy matches biometric check-ins within normal variance.'

  if (occlusionRisk === 'high') {
    // 13 expected with high occlusion typically counts ~8-10 visible
    observedMedian = Math.max(1, Math.round(expectedPresent * 0.72))
    status = 'UNVERIFIABLE'
    reason = `High occlusion risk flagged. Observed median (${observedMedian}) cannot reliably confirm all ${expectedPresent} trainees due to visual obstruction. Manual inspection required before action.`
  } else if (expectedPresent > 15) {
    observedMedian = Math.round(expectedPresent * 0.65)
    status = 'REVIEW_REQUIRED'
    reason = `Deficit detected: Expected ${expectedPresent} biometric check-ins, but video observed median was ${observedMedian}. Human review queued.`
  } else {
    observedMedian = expectedPresent
    status = 'NO_DEFICIT_DETECTED'
    reason = `Full parity verified: ${expectedPresent} present matching biometric records.`
  }

  const reconciliation: AttendanceReconciliation = {
    id: `REC-DEMO-${Date.now().toString().slice(-4)}`,
    centreId,
    centreName: getCentreName(centreId),
    state: 'Maharashtra',
    district: 'Pune',
    batchId,
    batchName: `${batchId} · CNC Operator`,
    roomName: 'Workshop Lab 1',
    observedAt: new Date().toISOString(),
    expectedPresent,
    biometricCheckIns: expectedPresent,
    biometricCheckOuts: 0,
    observedMedian,
    observedMax: observedMedian + 1,
    cameraQualityScore: 0.82,
    detectionConfidence: 0.78,
    countStability: 0.85,
    occlusionRisk,
    status,
    reason,
    evidence: [
      {
        type: 'snapshot',
        url: '/placeholder.jpg',
        capturedAt: new Date().toISOString(),
        observedOccupancy: observedMedian,
        evidenceQuality: 'medium',
      },
    ],
    auditTrail: [
      {
        action: 'MOCK_ANALYSIS_GENERATED',
        performedBy: 'SkillGuard Fallback Mock Engine',
        timestamp: new Date().toISOString(),
        details: fallbackReason,
      },
    ],
  }

  const mockSamples = Array.from({ length: 6 }, (_, i) => ({
    time_seconds: i * 1.0,
    visible_tracked_people: Math.max(1, observedMedian + (i % 2 === 0 ? 0 : -1)),
    mean_detection_confidence: 0.82,
    camera_quality_score: 0.88,
    camera_quality_status: 'healthy',
    camera_quality_flags: 'none',
    brightness: 64.5,
    blur_variance: 110.2,
    active_track_ids: Array.from({ length: observedMedian }, (_, idx) => String(idx + 1)).join(','),
    boxes: Array.from({ length: observedMedian }, (_, idx) => ({
      track_id: idx + 1,
      confidence: 0.85,
      box: [80 + (idx % 5) * 100, 140 + Math.floor(idx / 5) * 90, 130 + (idx % 5) * 100, 220 + Math.floor(idx / 5) * 90],
    })),
  }))

  const mockWindows = [
    {
      window_id: 0,
      start_time_seconds: 0.0,
      end_time_seconds: 5.0,
      observed_median: observedMedian,
      observed_mean: observedMedian,
      observed_min: observedMedian - 1,
      observed_max: observedMedian,
      detection_confidence: 0.82,
      camera_quality_score: 0.88,
      count_stability: 0.85,
      reported_attendance: expectedPresent,
      compliance_status: status,
      reason,
    },
  ]

  const mockEvents = ((status as string) === 'COMPLIANT' || (status as string) === 'NO_DEFICIT_DETECTED' || (status as string) === 'WITHIN_CAMERA_TOLERANCE') ? [] : [
    {
      event_id: `EVT-${centreId}-0000`,
      event_type: status.toLowerCase(),
      centre_id: centreId,
      camera_id: 'CAM-CLASSROOM-A',
      batch_id: batchId,
      window_start_seconds: 0.0,
      window_end_seconds: 5.0,
      reported_attendance: expectedPresent,
      observed_median_visible_people: observedMedian,
      camera_quality_score: 0.88,
      detection_confidence: 0.82,
      count_stability: 0.85,
      occlusion_risk: occlusionRisk,
      reason,
      review_required: true,
      generated_at_utc: new Date().toISOString(),
    },
  ]

  const rawAiResponse = {
    observation_id: `obs_demo_${Date.now().toString().slice(-6)}`,
    centre_id: centreId,
    batch_id: batchId,
    camera_id: 'CAM-CLASSROOM-A',
    video: {
      filename: 'classroom_cctv_footage.mp4',
      fps: 19.89,
      total_frames: 400,
      resolution: '640x352',
      duration_seconds: 20.0,
    },
    summary: {
      expected_present: expectedPresent,
      observed_median: observedMedian,
      observed_mean: observedMedian,
      observed_min: observedMedian - 1,
      observed_max: observedMedian,
      sample_count: 6,
      detection_confidence: 0.82,
      camera_quality_score: 0.88,
      count_stability: 0.85,
      occlusion_risk: occlusionRisk,
      unique_tracks: observedMedian,
    },
    decision: {
      status,
      reason,
      discrepancy: expectedPresent - observedMedian,
      tolerance_people: Math.round(expectedPresent * 0.15),
    },
    windows: mockWindows,
    events: mockEvents,
    samples: mockSamples,
    timeline: mockSamples,
    run_package: {
      run_metadata: {
        centre_id: centreId,
        camera_id: 'CAM-CLASSROOM-A',
        batch_id: batchId,
        reported_attendance: expectedPresent,
        occlusion_risk: occlusionRisk,
        model: 'RFDETRMedium',
        tracker: 'ByteTrackTracker',
        privacy_mode: 'aggregate occupancy; no facial identification',
      },
      events: mockEvents,
    },
  }

  return {
    reconciliation,
    aiDevice: 'cpu (fallback)',
    isDemoFallback: true,
    rawAiResponse,
    message: fallbackReason,
  }
}

export type LiveFrameInput = {
  imageBlob?: Blob
  imageBuffer?: Buffer
  centreId?: string
  batchId?: string
  expectedPresent?: number
}

export type LiveFrameResult = {
  status: 'success' | 'fallback' | 'error'
  timestamp: string
  peopleCount: number
  objectCount: number
  boxes: Array<{
    track_id: number
    confidence: number
    class_name: string
    category: 'person' | 'object'
    class_id?: number
    box: [number, number, number, number]
  }>
  cameraQuality: {
    score: number
    status: 'healthy' | 'degraded' | 'unhealthy'
    flags: string[]
    brightness: number
    blur_variance: number
  }
  frameWidth: number
  frameHeight: number
  isFallback: boolean
  message?: string
}

export async function analyzeLiveFrameWithAI(input: LiveFrameInput): Promise<LiveFrameResult> {
  const centreId = input.centreId || 'TC-LIVE-001'
  const batchId = input.batchId || 'BATCH-LIVE-001'
  const expectedPresent = input.expectedPresent ?? 1

  if (!AI_ENABLED) {
    return createFallbackLiveFrameResult(centreId, batchId, expectedPresent, 'AI disabled in .env')
  }

  try {
    const formData = new FormData()
    formData.append('centre_id', centreId)
    formData.append('batch_id', batchId)
    formData.append('expected_present', String(expectedPresent))

    if (input.imageBlob) {
      formData.append('frame', input.imageBlob, 'live_frame.jpg')
    } else if (input.imageBuffer) {
      const blob = new Blob([new Uint8Array(input.imageBuffer)], { type: 'image/jpeg' })
      formData.append('frame', blob, 'live_frame.jpg')
    } else {
      throw new Error('No frame data provided')
    }

    const res = await fetchWithTimeout(
      `${AI_BASE_URL}/v1/analysis/frame`,
      {
        method: 'POST',
        body: formData,
      },
      4_000 // 4s timeout for single frame inference
    )

    if (!res.ok) {
      throw new Error(`AI service returned HTTP ${res.status}`)
    }

    const json = await res.json()
    return {
      status: 'success',
      timestamp: json.timestamp || new Date().toISOString(),
      peopleCount: json.people_count ?? 1,
      objectCount: json.object_count ?? 0,
      boxes: json.boxes || [],
      cameraQuality: {
        score: json.camera_quality?.score ?? 0.88,
        status: json.camera_quality?.status ?? 'healthy',
        flags: json.camera_quality?.flags ?? [],
        brightness: json.camera_quality?.brightness ?? 75,
        blur_variance: json.camera_quality?.blur_variance ?? 110,
      },
      frameWidth: json.frame_width ?? 640,
      frameHeight: json.frame_height ?? 480,
      isFallback: false,
    }
  } catch (err: any) {
    return createFallbackLiveFrameResult(centreId, batchId, expectedPresent, err.message)
  }
}

function createFallbackLiveFrameResult(centreId: string, batchId: string, expectedPresent: number, reason: string): LiveFrameResult {
  return {
    status: 'fallback',
    timestamp: new Date().toISOString(),
    peopleCount: 1,
    objectCount: 2,
    boxes: [
      {
        track_id: 1,
        confidence: 0.94,
        class_name: 'person',
        category: 'person',
        class_id: 1,
        box: [180, 70, 460, 420],
      },
      {
        track_id: 101,
        confidence: 0.88,
        class_name: 'laptop',
        category: 'object',
        class_id: 63,
        box: [220, 360, 420, 470],
      },
      {
        track_id: 102,
        confidence: 0.81,
        class_name: 'chair',
        category: 'object',
        class_id: 56,
        box: [160, 200, 480, 480],
      },
    ],
    cameraQuality: {
      score: 0.91,
      status: 'healthy',
      flags: [],
      brightness: 78.4,
      blur_variance: 142.0,
    },
    frameWidth: 640,
    frameHeight: 480,
    isFallback: true,
    message: reason,
  }
}

