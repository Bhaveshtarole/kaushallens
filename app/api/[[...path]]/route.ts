import { NextResponse } from 'next/server'
import { summary, centres, cases, detail, attendance, inventory, cameras, reconciliations, biometricDevices, biometricEvents, videoJobs } from '@/lib/mock-data'

type RouteParams = { params: Promise<{ path?: string[] }> }

export async function GET(_: Request, { params }: RouteParams) {
  const p = (await params).path || []
  const key = p.join('/')
  const url = new URL(_.url)
  await new Promise(r => setTimeout(r, process.env.NODE_ENV === 'development' ? 350 : 0))

  // ── Existing routes ──
  if (key === 'dashboard/summary') return NextResponse.json(summary)
  if (key === 'centres') return NextResponse.json(centres)
  if (key.startsWith('centres/') && !key.includes('/batches') && !key.includes('/inventory') && !key.includes('/cameras')) return NextResponse.json(detail(key.split('/')[1]))
  if (key === 'cases') return NextResponse.json(cases)
  if (key.startsWith('cases/') && !key.includes('/assign') && !key.includes('/review') && !key.includes('/escalate') && !key.includes('/close')) return NextResponse.json(cases.find(c => c.id === key.split('/')[1]) || cases[0])
  if (key === 'attendance') return NextResponse.json(attendance)
  if (key === 'infrastructure') return NextResponse.json(inventory)
  if (key === 'camera-health') return NextResponse.json(cameras)
  if (key === 'reports') return NextResponse.json({ reports: ['Daily compliance summary', 'Attendance discrepancy report', 'Infrastructure exception report', 'Camera health report', 'Case-resolution report'] })
  if (key === 'notifications') return NextResponse.json([{ id: '1', text: '3 critical cases need attention', at: '10 min ago' }])

  // ── v1 Reconciliation routes ──
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

  // GET /api/v1/reconciliations/:id
  if (key.startsWith('v1/reconciliations/') && p.length === 3) {
    const id = p[2]
    const rec = reconciliations.find(r => r.id === id)
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rec)
  }

  // GET /api/v1/biometric-devices
  if (key === 'v1/biometric-devices') {
    return NextResponse.json(biometricDevices)
  }

  // GET /api/v1/attendance/:centreId/:batchId
  if (key.startsWith('v1/attendance/') && p.length === 4) {
    const centreId = p[2]
    const batchId = p[3]
    const events = biometricEvents.filter(e => e.centreId === centreId && e.batchId === batchId)
    const checkIns = events.filter(e => e.eventType === 'CHECK_IN').length
    const checkOuts = events.filter(e => e.eventType === 'CHECK_OUT').length
    return NextResponse.json({ centreId, batchId, checkIns, checkOuts, expectedPresent: checkIns - checkOuts, events })
  }

  // GET /api/v1/analysis/video-jobs/:id
  if (key.startsWith('v1/analysis/video-jobs/') && p.length === 4) {
    const jobId = p[3]
    const job = videoJobs.find(j => j.id === jobId)
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(job)
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: Request, { params }: RouteParams) {
  const p = (await params).path || []
  const key = p.join('/')
  const body = await req.json().catch(() => ({}))

  // POST /api/v1/reconciliations/:id/review
  if (key.startsWith('v1/reconciliations/') && key.endsWith('/review')) {
    const id = p[2]
    const rec = reconciliations.find(r => r.id === id)
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { decision, note, reviewer } = body as { decision?: string; note?: string; reviewer?: string }
    if (!decision || !note) return NextResponse.json({ error: 'decision and note are required' }, { status: 400 })
    // Mutate in-memory for demo session persistence
    rec.reviewer = {
      name: reviewer || 'Demo Reviewer',
      decision: decision as 'CONFIRMED' | 'DISMISSED',
      note,
      decidedAt: new Date().toISOString(),
    }
    rec.status = decision === 'CONFIRMED' ? 'CONFIRMED_BY_REVIEWER' : 'DISMISSED_BY_REVIEWER'
    return NextResponse.json({ ok: true, message: 'Review recorded', reconciliation: rec })
  }

  // POST /api/v1/biometric/events
  if (key === 'v1/biometric/events') {
    return NextResponse.json({ ok: true, message: 'Events ingested', count: Array.isArray(body.events) ? body.events.length : 0 })
  }

  // POST /api/v1/analysis/video-jobs — returns 202 Accepted
  if (key === 'v1/analysis/video-jobs') {
    const jobId = `VJ-MOCK-${Date.now()}`
    return NextResponse.json(
      { jobId, status: 'QUEUED', message: 'Video analysis job accepted. Poll GET /api/v1/analysis/video-jobs/:id for status.' },
      { status: 202 }
    )
  }

  // Existing POST catch-all
  return NextResponse.json({ ok: true, message: 'Action recorded', path: key, body })
}
