/**
 * SkillGuard AI Service Client
 * Server-side only — called from API route handlers, never from the browser.
 * When SKILLGUARD_AI_ENABLED=false (default), returns mock data.
 */

const AI_BASE_URL = process.env.SKILLGUARD_AI_BASE_URL || 'http://127.0.0.1:8000'
const AI_ENABLED = process.env.SKILLGUARD_AI_ENABLED === 'true'
const AI_TIMEOUT_MS = 15_000

type VideoAnalysisRequest = {
  centreId: string
  batchId: string
  videoRef: string
}

type VideoAnalysisResult = {
  observedMedian: number
  detectionConfidence: number
  countStability: number
  occlusionRisk: 'low' | 'medium' | 'high'
}

type ReconciliationRequest = {
  centreId: string
  batchId: string
  expectedPresent: number
  observedMedian: number
  cameraQualityScore: number
  detectionConfidence: number
  countStability: number
  occlusionRisk: 'low' | 'medium' | 'high'
}

type ReconciliationResult = {
  status: string
  reason: string
}

type HealthResponse = {
  status: string
  version?: string
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = AI_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/** Check if the AI service is reachable */
export async function checkHealth(): Promise<HealthResponse> {
  if (!AI_ENABLED) return { status: 'mock', version: 'demo' }
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/health`)
    if (!res.ok) throw new Error(`AI health check failed: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[ai-client] Health check failed:', err)
    return { status: 'unreachable' }
  }
}

/** Submit a video for analysis. Returns a job ID. */
export async function submitVideoAnalysis(req: VideoAnalysisRequest): Promise<{ jobId: string; status: string }> {
  if (!AI_ENABLED) {
    // Mock: return an immediate completed job
    return { jobId: `VJ-MOCK-${Date.now()}`, status: 'COMPLETED' }
  }
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/analysis/video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(`Video analysis submission failed: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[ai-client] Video analysis submission failed:', err)
    return { jobId: `VJ-FALLBACK-${Date.now()}`, status: 'FAILED' }
  }
}

/** Get video analysis result (mock returns a completed result) */
export async function getVideoAnalysisResult(jobId: string): Promise<{ status: string; result?: VideoAnalysisResult }> {
  if (!AI_ENABLED) {
    return {
      status: 'COMPLETED',
      result: { observedMedian: 14, detectionConfidence: 0.87, countStability: 0.91, occlusionRisk: 'low' },
    }
  }
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/analysis/video/${jobId}`)
    if (!res.ok) throw new Error(`Video analysis result fetch failed: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[ai-client] Video analysis result fetch failed:', err)
    return { status: 'FAILED' }
  }
}

/** Post biometric attendance events */
export async function postAttendanceEvents(events: unknown[]): Promise<{ ok: boolean }> {
  if (!AI_ENABLED) return { ok: true }
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/attendance/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    })
    if (!res.ok) throw new Error(`Attendance event post failed: ${res.status}`)
    return { ok: true }
  } catch (err) {
    console.error('[ai-client] Attendance event post failed:', err)
    return { ok: false }
  }
}

/** Get attendance for a centre/batch */
export async function getAttendance(centreId: string, batchId: string): Promise<unknown> {
  if (!AI_ENABLED) return null
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/attendance/${centreId}/${batchId}`)
    if (!res.ok) throw new Error(`Attendance fetch failed: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[ai-client] Attendance fetch failed:', err)
    return null
  }
}

/** Request reconciliation analysis */
export async function requestReconciliation(req: ReconciliationRequest): Promise<ReconciliationResult> {
  if (!AI_ENABLED) {
    // Mock: compute simple status based on difference
    const diff = req.expectedPresent - req.observedMedian
    const ratio = diff / Math.max(req.expectedPresent, 1)
    if (req.cameraQualityScore < 0.3) return { status: 'CAMERA_UNHEALTHY', reason: 'Camera quality score is below acceptable threshold.' }
    if (req.occlusionRisk === 'high' || req.detectionConfidence < 0.5) return { status: 'UNVERIFIABLE', reason: 'High occlusion or low detection confidence prevents reliable comparison.' }
    if (ratio > 0.3) return { status: 'REVIEW_REQUIRED', reason: `Observed occupancy (${req.observedMedian}) is significantly below biometric expected (${req.expectedPresent}).` }
    if (diff <= 1) return { status: 'NO_DEFICIT_DETECTED', reason: 'Video occupancy matches biometric attendance within normal variance.' }
    return { status: 'WITHIN_CAMERA_TOLERANCE', reason: `Minor difference of ${diff} is within expected camera tolerance.` }
  }
  try {
    const res = await fetchWithTimeout(`${AI_BASE_URL}/v1/reconciliation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(`Reconciliation request failed: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[ai-client] Reconciliation request failed:', err)
    return { status: 'UNVERIFIABLE', reason: 'AI service unavailable; manual verification required.' }
  }
}
