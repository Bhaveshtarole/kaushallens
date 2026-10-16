import { NextResponse } from 'next/server'
import {
  summary,
  centres,
  cases,
  detail,
  attendance,
  inventory,
  cameras,
  reconciliations,
  biometricDevices,
  biometricEvents,
  videoJobs,
} from '@/lib/mock-data'
import {
  getAIHealth,
  forwardBiometricEvents,
  getAIAttendance,
  analyzeVideoWithAI,
  type VideoJobInput,
} from '@/lib/ai-client'

type RouteParams = { params: Promise<{ path?: string[] }> }

export async function GET(req: Request, { params }: RouteParams) {
  const p = (await params).path || []
  const key = p.join('/')
  const url = new URL(req.url)

  // Small delay for dev smoothness
  await new Promise(r => setTimeout(r, process.env.NODE_ENV === 'development' ? 100 : 0))

  // ── Route: GET /api/v1/ai/health ──
  if (key === 'v1/ai/health') {
    const health = await getAIHealth()
    return NextResponse.json(health)
  }

  // ── Existing Dashboard & Operational routes ──
  if (key === 'dashboard/summary') {
    const activeCentres = centres.length
    const camerasHealthy = centres.reduce((acc, c) => acc + (c.camerasHealthy || 0), 0)
    const camerasTotal = centres.reduce((acc, c) => acc + (c.camerasTotal || 3), 0)
    const openCases = cases.filter(c => c.status === 'open' || c.status === 'under_review').length
    const criticalAlerts = cases.filter(c => c.severity === 'critical' && c.status !== 'resolved' && c.status !== 'closed').length
    const highAlerts = cases.filter(c => c.severity === 'high' && c.status !== 'resolved' && c.status !== 'closed').length
    const mediumAlerts = cases.filter(c => c.severity === 'medium' && c.status !== 'resolved' && c.status !== 'closed').length
    const offlineCentres = centres.filter(c => c.status === 'Camera Issue' || c.status === 'Offline' || c.status === 'Unverifiable').length

    return NextResponse.json({
      ...summary,
      centres,
      cases,
      severity: [
        { name: 'Critical', value: Math.max(1, criticalAlerts), fill: '#ef4444' },
        { name: 'High', value: Math.max(1, highAlerts), fill: '#f59e0b' },
        { name: 'Medium', value: Math.max(1, mediumAlerts), fill: '#3b82f6' },
      ],
      totals: {
        activeCentres,
        camerasHealthy,
        camerasTotal,
        activeBatches: centres.length + 5,
        openCases,
        criticalAlerts,
        offlineCentres,
      },
    })
  }
  if (key === 'centres') return NextResponse.json(centres)
  if (key.startsWith('centres/') && !key.includes('/batches') && !key.includes('/inventory') && !key.includes('/cameras')) {
    return NextResponse.json(detail(key.split('/')[1]))
  }
  if (key === 'cases') return NextResponse.json(cases)
  if (key.startsWith('cases/') && !key.includes('/assign') && !key.includes('/review') && !key.includes('/escalate') && !key.includes('/close')) {
    return NextResponse.json(cases.find(c => c.id === key.split('/')[1]) || cases[0])
  }
  if (key === 'attendance') return NextResponse.json(attendance)
  if (key === 'infrastructure') return NextResponse.json(inventory)
  if (key === 'camera-health') return NextResponse.json(cameras)
  if (key === 'reports') {
    return NextResponse.json({
      reports: [
        'Daily compliance summary',
        'Attendance discrepancy report',
        'Infrastructure exception report',
        'Camera health report',
        'Case-resolution report',
      ],
    })
  }
  if (key === 'notifications') {
    return NextResponse.json([{ id: '1', text: '3 critical cases need attention', at: '10 min ago' }])
  }

  // ── Route: GET /api/v1/reconciliations ──
  if (key === 'v1/reconciliations') {
    let filtered = [...reconciliations]
    const centreId = url.searchParams.get('centreId')
    const status = url.searchParams.get('status')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    if (centreId) filtered = filtered.filter(r => r.centreId === centreId)
    if (status) filtered = filtered.filter(r => r.status === status)
    if (from) filtered = filtered.filter(r => r.observedAt >= from)
    if (to) filtered = filtered.filter(r => r.observedAt <= to)
    return NextResponse.json(filtered)
  }

  // ── Route: GET /api/v1/reconciliations/:id ──
  if (key.startsWith('v1/reconciliations/') && p.length === 3) {
    const id = p[2]
    const rec = reconciliations.find(r => r.id === id)
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rec)
  }

  // ── Route: GET /api/v1/biometric-devices ──
  if (key === 'v1/biometric-devices') {
    return NextResponse.json(biometricDevices)
  }

  // ── Route: GET /api/v1/attendance/:centreId/:batchId ──
  if (key.startsWith('v1/attendance/') && p.length === 4) {
    const centreId = p[2]
    const batchId = p[3]

    // Try AI service first
    const aiSnapshot = await getAIAttendance(centreId, batchId)
    if (aiSnapshot) {
      return NextResponse.json({
        centreId: aiSnapshot.centre_id,
        batchId: aiSnapshot.batch_id,
        expectedPresent: aiSnapshot.expected_present,
        checkIns: aiSnapshot.checked_in,
        checkOuts: aiSnapshot.checked_out,
        calculatedAt: aiSnapshot.calculated_at,
        source: 'skillguard-local-ai',
      })
    }

    // Fallback to local mock biometric records
    const events = biometricEvents.filter(e => e.centreId === centreId && e.batchId === batchId)
    const checkIns = events.filter(e => e.eventType === 'CHECK_IN').length
    const checkOuts = events.filter(e => e.eventType === 'CHECK_OUT').length
    return NextResponse.json({
      centreId,
      batchId,
      checkIns,
      checkOuts,
      expectedPresent: Math.max(0, checkIns - checkOuts),
      events,
      source: 'mock-fallback',
      message: 'AI service unavailable — demo data shown',
    })
  }

  // ── Route: GET /api/v1/analysis/video-jobs/:id ──
  if (key.startsWith('v1/analysis/video-jobs/') && p.length === 4) {
    const jobId = p[3]
    const job = videoJobs.find(j => j.id === jobId)
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(job)
  }

  // ── Route: GET /api/v1/analysis/video/:observationId/annotated ──
  if (key.startsWith('v1/analysis/video/') && key.endsWith('/annotated')) {
    const obsId = p[3]
    try {
      const aiBase = process.env.SKILLGUARD_AI_BASE_URL || 'http://127.0.0.1:8000'
      const upstream = await fetch(`${aiBase}/v1/analysis/video/${obsId}/annotated`)
      if (!upstream.ok) {
        return NextResponse.json({ error: 'Annotated video not available' }, { status: 404 })
      }
      const buffer = await upstream.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(buffer.byteLength),
          'Accept-Ranges': 'bytes',
        },
      })
    } catch {
      return NextResponse.json({ error: 'Upstream video fetch failed' }, { status: 502 })
    }
  }

  // ── Route: GET /api/v1/analysis/video/:observationId/package ──
  if (key.startsWith('v1/analysis/video/') && key.endsWith('/package')) {
    const obsId = p[3]
    try {
      const aiBase = process.env.SKILLGUARD_AI_BASE_URL || 'http://127.0.0.1:8000'
      const upstream = await fetch(`${aiBase}/v1/analysis/video/${obsId}/package`)
      if (!upstream.ok) {
        return NextResponse.json({ error: 'Package not available' }, { status: 404 })
      }
      const pkg = await upstream.json()
      return NextResponse.json(pkg)
    } catch {
      return NextResponse.json({ error: 'Upstream package fetch failed' }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: Request, { params }: RouteParams) {
  const p = (await params).path || []
  const key = p.join('/')

  // ── Route: POST /api/centres (Add new centre or update existing) ──
  if (key === 'centres') {
    try {
      const body = await req.json().catch(() => ({}))
      const id = (body.id || `CTR-${String(centres.length + 1).padStart(3, '0')}`).toUpperCase().trim()
      const existingIndex = centres.findIndex(c => c.id === id)

      const newCentre = {
        id,
        name: body.name || `${body.district || 'New'} Skill Development Centre`,
        state: body.state || 'Maharashtra',
        district: body.district || 'Central',
        status: (body.status || 'Compliant') as any,
        score: Number(body.score) || 95,
        attendanceMatch: Number(body.attendanceMatch) || 95,
        infrastructureScore: Number(body.infrastructureScore) || 92,
        openCases: Number(body.openCases) || 0,
        camerasHealthy: Number(body.camerasHealthy) || Number(body.camerasTotal) || 3,
        camerasTotal: Number(body.camerasTotal) || 3,
        lastSync: 'Just now',
        risk: (body.risk || 'Low') as any,
      }

      if (existingIndex >= 0) {
        centres[existingIndex] = { ...centres[existingIndex], ...newCentre }
      } else {
        centres.unshift(newCentre)
      }

      return NextResponse.json({ ok: true, centre: newCentre })
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
    }
  }

  // ── Route: POST /api/v1/biometric/events ──
  if (key === 'v1/biometric/events') {
    try {
      const body = await req.json()
      const rawEvents = Array.isArray(body) ? body : Array.isArray(body.events) ? body.events : []
      const forwardResult = await forwardBiometricEvents(rawEvents)
      return NextResponse.json({
        ok: forwardResult.success,
        count: forwardResult.accepted || rawEvents.length,
        isFallback: forwardResult.isFallback,
        message: forwardResult.message,
      })
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
    }
  }

  // ── Route: POST /api/v1/analysis/video-jobs ──
  if (key === 'v1/analysis/video-jobs') {
    try {
      const contentType = req.headers.get('content-type') || ''
      let jobInput: VideoJobInput

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData()
        const video = formData.get('video') as File | null
        const centreId = (formData.get('centreId') || formData.get('centre_id') || 'TC-MH-0042') as string
        const batchId = (formData.get('batchId') || formData.get('batch_id') || 'BATCH-DEMO-101') as string
        const expectedPresent = Number(formData.get('expectedPresent') || formData.get('expected_present') || 13)
        const occlusionRisk = ((formData.get('occlusionRisk') || formData.get('occlusion_risk') || 'medium') as 'low' | 'medium' | 'high')

        if (!video) {
          // If no video attached, create a mock dummy buffer for demo mode
          jobInput = {
            centreId,
            batchId,
            expectedPresent,
            occlusionRisk,
            videoBuffer: Buffer.from('mock video container'),
            videoFilename: 'classroom_cctv_footage.mp4',
          }
        } else {
          const arrayBuffer = await video.arrayBuffer()
          jobInput = {
            centreId,
            batchId,
            expectedPresent,
            occlusionRisk,
            videoBuffer: Buffer.from(arrayBuffer),
            videoFilename: video.name || 'classroom_cctv_footage.mp4',
          }
        }
      } else {
        const json = await req.json().catch(() => ({}))
        jobInput = {
          centreId: json.centreId || json.centre_id || 'TC-MH-0042',
          batchId: json.batchId || json.batch_id || 'BATCH-DEMO-101',
          expectedPresent: Number(json.expectedPresent || json.expected_present || 13),
          occlusionRisk: (json.occlusionRisk || json.occlusion_risk || 'medium') as 'low' | 'medium' | 'high',
          videoBuffer: Buffer.from('mock video container'),
          videoFilename: 'classroom_cctv_footage.mp4',
        }
      }

      // Execute video analysis with 120s timeout and safe fallback
      const analysisResult = await analyzeVideoWithAI(jobInput)

      // Insert reconciliation into in-memory list so it is immediately visible in the UI
      reconciliations.unshift(analysisResult.reconciliation)

      // Connect AI analysis result directly to Centre and Command Centre states
      const targetCentreId = jobInput.centreId
      const recon = analysisResult.reconciliation
      const isDeficit = recon.status === 'REVIEW_REQUIRED'
      const isCameraIssue = recon.status === 'CAMERA_UNHEALTHY'
      const isUnverifiable = recon.status === 'UNVERIFIABLE'

      const centreStatus = isDeficit ? 'Needs Review' : (isCameraIssue ? 'Camera Issue' : (isUnverifiable ? 'Unverifiable' : 'Compliant'))
      const matchPct = Math.min(100, Math.round((recon.observedMedian / Math.max(1, recon.expectedPresent)) * 100))

      let existingCentre = centres.find(c => c.id === targetCentreId)
      if (existingCentre) {
        existingCentre.status = centreStatus as any
        existingCentre.attendanceMatch = matchPct
        existingCentre.score = isDeficit ? Math.min(68, matchPct) : Math.max(88, matchPct)
        existingCentre.lastSync = 'Just now'
        if (isDeficit) existingCentre.openCases = (existingCentre.openCases || 0) + 1
      } else {
        const stateName = targetCentreId.includes('-DL-') ? 'Delhi' : (targetCentreId.includes('-MH-') ? 'Maharashtra' : 'Delhi')
        const districtName = targetCentreId.includes('-DL-') ? 'New Delhi' : (targetCentreId.includes('-MH-') ? 'Pune' : 'Delhi')
        const newCentre = {
          id: targetCentreId,
          name: recon.centreName || `${districtName} Skill Development Centre`,
          state: stateName,
          district: districtName,
          status: centreStatus as any,
          score: isDeficit ? Math.min(68, matchPct) : Math.max(88, matchPct),
          attendanceMatch: matchPct,
          infrastructureScore: 92,
          openCases: isDeficit ? 1 : 0,
          camerasHealthy: isCameraIssue ? 1 : 3,
          camerasTotal: 3,
          lastSync: 'Just now',
          risk: (isDeficit ? 'High' : 'Low') as any,
        }
        centres.unshift(newCentre)
      }

      // If AI detects a deficit or camera issue, automatically generate a Case for Command Centre attention
      if (isDeficit || isCameraIssue) {
        const newCase = {
          id: `CASE-${Date.now().toString().slice(-4)}`,
          title: isDeficit
            ? `Attendance variance detected (${recon.batchName})`
            : `Camera signal exception (${targetCentreId})`,
          category: (isDeficit ? 'attendance' : 'camera_health') as any,
          severity: (isDeficit ? 'critical' : 'high') as any,
          status: 'open' as any,
          centreId: targetCentreId,
          centreName: recon.centreName || existingCentre?.name || `${targetCentreId} Vocational Centre`,
          state: existingCentre?.state || (targetCentreId.includes('-DL-') ? 'Delhi' : 'Maharashtra'),
          district: existingCentre?.district || (targetCentreId.includes('-DL-') ? 'New Delhi' : 'Pune'),
          roomName: recon.roomName || 'Classroom A',
          batchName: recon.batchName,
          expectedValue: recon.expectedPresent,
          observedValue: recon.observedMedian,
          confidence: recon.detectionConfidence || 0.85,
          evidenceQuality: ((recon.cameraQualityScore || 1.0) > 0.7 ? 'high' : 'medium') as any,
          triggerReason: isDeficit
            ? `AI Model detected persistent deficit: ${recon.observedMedian} observed occupants against ${recon.expectedPresent} reported.`
            : `Camera feed health score dropped to ${recon.cameraQualityScore || 0}.`,
          createdAt: 'Just now',
          updatedAt: new Date().toISOString(),
          slaDueAt: new Date(Date.now() + 86400000).toISOString(),
          evidenceIds: [`EV-${recon.id}`],
        }
        cases.unshift(newCase)
      }

      return NextResponse.json(
        {
          success: true,
          jobId: `VJ-${Date.now().toString().slice(-6)}`,
          status: 'COMPLETED',
          reconciliation: analysisResult.reconciliation,
          rawAiResponse: analysisResult.rawAiResponse,
          aiDevice: analysisResult.aiDevice,
          isDemoFallback: analysisResult.isDemoFallback,
          message: analysisResult.message,
        },
        { status: 200 }
      )
    } catch (err: any) {
      console.error('[route] video-jobs handler failed:', err)
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
  }

  // ── Route: POST /api/v1/reconciliations/:id/review ──
  if (key.startsWith('v1/reconciliations/') && key.endsWith('/review')) {
    const id = p[2]
    const rec = reconciliations.find(r => r.id === id)
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json().catch(() => ({}))
    const { decision, note, reviewer } = body as { decision?: string; note?: string; reviewer?: string }
    if (!decision || !note) return NextResponse.json({ error: 'decision and note are required' }, { status: 400 })

    rec.reviewer = {
      name: reviewer || 'Arjun Sharma',
      decision: decision as 'CONFIRMED' | 'DISMISSED',
      note,
      decidedAt: new Date().toISOString(),
    }
    rec.status = decision === 'CONFIRMED' ? 'CONFIRMED_BY_REVIEWER' : 'DISMISSED_BY_REVIEWER'
    return NextResponse.json({ ok: true, message: 'Review recorded', reconciliation: rec })
  }

  // Fallback POST catch-all
  const fallbackBody = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, message: 'Action recorded', path: key, body: fallbackBody })
}
