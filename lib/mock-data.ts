import type { Centre, ComplianceCase, DashboardSummary, CentreDetail, AttendanceRecord, InventoryItem, Camera, Batch } from './types'
const states = [['Maharashtra','Pune'],['Maharashtra','Nashik'],['Uttar Pradesh','Lucknow'],['Uttar Pradesh','Varanasi'],['Karnataka','Bengaluru'],['Karnataka','Mysuru'],['Rajasthan','Jaipur'],['Rajasthan','Kota'],['Assam','Guwahati'],['Tamil Nadu','Chennai'],['Tamil Nadu','Madurai'],['Maharashtra','Nagpur']]
export const centres: Centre[] = states.map(([state,district],i)=>({
  id:`CTR-${String(i+1).padStart(3,'0')}`,
  name:`${district} Skill Development Centre`,
  state,
  district,
  status:(i===0?'Compliant':i===1?'Compliant':i===2?'Needs Review':i===5?'Camera Issue':i===8?'Unverifiable':'Compliant') as any,
  score:[94,88,71,82,97,64,91,86,58,93,89,78][i],
  attendanceMatch:[94,88,71,84,95,64,89,83,55,91,87,76][i],
  infrastructureScore:[92,85,68,80,94,70,88,84,62,90,86,77][i],
  openCases:[1,2,4,2,0,5,1,2,6,0,1,3][i],
  camerasHealthy:[3,2,2,3,3,1,2,3,1,3,3,2][i],
  camerasTotal:3,
  lastSync:i===5?'38 min ago':'3 min ago',
  risk:i===8?'High':i===5?'High':i===2?'Medium':'Low'
}))
const categories=['attendance','infrastructure','camera_health','connectivity'] as const
const titles=['Missing workbench observation','Camera obstruction detected','Low-light evidence needs review','Attendance variance detected','Edge device offline','Repeated infrastructure gap','Attendance verified — no action']
export const cases: ComplianceCase[] = Array.from({length:28},(_,i)=>{
  const c=i===0?centres[1]:i===1?centres[2]:i===2?centres[3]:centres[i%centres.length];
  const cat=categories[i%4];
  const severity: any=i===0?'critical':i===1?'high':i===2?'medium':i%9===0?'critical':i%3===0?'high':i%2===0?'medium':'low';
  const title=i<3?titles[i]:titles[i%titles.length];
  const reason=i===0?'Expected: 10 | Observed: 6':i===1?'Camera feed unclear for 15+ minutes':i===2?'Image quality below threshold':'Observed occupancy remained below reported attendance for 3 consecutive windows.';
  const timeStr=i===0?'10:06 AM · 06 Oct 2026':i===1?'10:05 AM · 05 Oct 2026':i===2?'10:04 AM · 04 Oct 2026':`2026-10-${String(7-i%7).padStart(2,'0')}T${String(9+i%8).padStart(2,'0')}:20:00Z`;
  return {id:`CASE-${String(2401+i)}`,title,category:cat,severity,status:i%8===0?'resolved':i%7===0?'under_review':'open',centreId:c.id,centreName:c.name,state:c.state,district:c.district,roomName:`Workshop ${i%3+1}`,batchName:`Batch ${String(i%6+1).padStart(2,'0')} · ${['Electrical','Fitter','Welding'][i%3]}`,expectedValue:i===0?10:cat==='attendance'?24:4,observedValue:i===0?6:cat==='attendance'?18+i%8:3,confidence:i%5===0?0.42:0.84,evidenceQuality:i%5===0?'low':'high',triggerReason:reason,createdAt:timeStr,updatedAt:'2026-10-07T10:20:00Z',assignedTo:i%3===0?'A. Sharma':undefined,slaDueAt:'2026-10-08T18:00:00Z',evidenceIds:[`EV-${i+1}`]}
})
const cameras: Camera[] = Array.from({length:30},(_,i)=>({id:`CAM-${String(i+1).padStart(3,'0')}`,room:`Workshop ${i%3+1}`,status:i%11===0?'offline':i%7===0?'obstructed':i%13===0?'dark':'healthy',quality:i%11===0?0:i%7===0?42:92,lastSync:i%11===0?'38 min ago':'3 min ago',edgeStatus:i%11===0?'Offline':'Online',people:12+i%17}))
const batches: Batch[] = Array.from({length:18},(_,i)=>({id:`BAT-${i+1}`,name:`Batch ${String(i+1).padStart(2,'0')}`,trade:['Electrical','Fitter','Welding'][i%3],schedule:'09:00 – 13:00',reported:20+i%8,observed:17+i%9,status:i%5===0?'Potential discrepancy':'Compliant'}))
const inventory: InventoryItem[] = ['Workbenches','Chairs','Computers','Projectors','Training machines','Safety equipment'].flatMap((item,j)=>centres.slice(0,2).map((c,i)=>({item,room:`Workshop ${i+1}`,expected:8+j%4,observed:j===0&&i===0?5:8+j%4,status:j===0&&i===0?'Potential discrepancy':j===3?'Unverifiable':'Compliant'})))
export function detail(id:string): CentreDetail { const c=centres.find(x=>x.id===id)||centres[0]; return {...c,address:`${c.district} Industrial Estate, ${c.state}`,manager:'Priya Menon',batches:batches.slice(0,3),cameras:cameras.slice((centres.indexOf(c)*2)%24,(centres.indexOf(c)*2)%24+3),inventory:inventory.slice(0,8),timeline:[{date:'07 Oct 2026, 10:20',text:'Camera health check completed',tone:'teal'},{date:'06 Oct 2026, 16:40',text:'Attendance report synced by centre operator',tone:'blue'},{date:'05 Oct 2026, 09:15',text:'Infrastructure inventory reviewed',tone:'amber'}]}}
export const attendance: AttendanceRecord[] = Array.from({length:7},(_,i)=>({day:['2 Oct','3 Oct','4 Oct','5 Oct','6 Oct','7 Oct','8 Oct'][i],batch:'All active batches',reported:[26000,29000,29500,30000,33000,34500,36000][i],observed:[19000,22000,23000,22500,26000,28000,30000][i],variance:[7000,7000,6500,7500,7000,6500,6000][i]}))
export const attendanceTrend = [
  { day: '2 Oct', reported: 26000, observed: 19000, discrepancies: 7000 },
  { day: '3 Oct', reported: 29000, observed: 22000, discrepancies: 7000 },
  { day: '4 Oct', reported: 29500, observed: 23000, discrepancies: 6500 },
  { day: '5 Oct', reported: 30000, observed: 22500, discrepancies: 7500 },
  { day: '6 Oct', reported: 33000, observed: 26000, discrepancies: 7000 },
  { day: '7 Oct', reported: 34500, observed: 28000, discrepancies: 6500 },
  { day: '8 Oct', reported: 36000, observed: 30000, discrepancies: 6000 },
]
export const summary: DashboardSummary = {
  centres,
  cases,
  attendanceTrend,
  severity: [
    { name: 'Critical', value: 3, fill: '#ef4444' },
    { name: 'High', value: 8, fill: '#f59e0b' },
    { name: 'Medium', value: 11, fill: '#3b82f6' },
  ],
  totals: {
    activeCentres: 124,
    camerasHealthy: 118,
    camerasTotal: 124,
    activeBatches: 18,
    openCases: 22,
    criticalAlerts: 3,
    offlineCentres: 6
  }
}
export { cameras, batches, inventory }

// ── Biometric-to-Video Attendance Reconciliation mock data ──
import type { AttendanceReconciliation, BiometricDevice, BiometricEvent, VideoAnalysisJob, ReconciliationStatus } from './types'

const reconStatuses: { status: ReconciliationStatus; expected: number; observed: number; quality: number; confidence: number; stability: number; occlusion: 'low'|'medium'|'high'; reason: string }[] = [
  { status: 'NO_DEFICIT_DETECTED', expected: 20, observed: 19.5, quality: 0.94, confidence: 0.92, stability: 0.95, occlusion: 'low', reason: 'Video occupancy matches biometric attendance within normal variance.' },
  { status: 'NO_DEFICIT_DETECTED', expected: 15, observed: 15, quality: 0.91, confidence: 0.89, stability: 0.93, occlusion: 'low', reason: 'Observed aggregate matches biometric check-in count exactly.' },
  { status: 'WITHIN_CAMERA_TOLERANCE', expected: 13, observed: 12, quality: 0.88, confidence: 0.85, stability: 0.88, occlusion: 'low', reason: 'Minor difference of 1 is within expected camera tolerance.' },
  { status: 'WITHIN_CAMERA_TOLERANCE', expected: 22, observed: 20, quality: 0.86, confidence: 0.82, stability: 0.84, occlusion: 'low', reason: 'Difference of 2 is within the ±15% camera tolerance band for this room size.' },
  { status: 'UNVERIFIABLE', expected: 13, observed: 10.5, quality: 0.62, confidence: 0.44, stability: 0.55, occlusion: 'high', reason: 'High occlusion due to crowded classroom layout. Detection confidence too low for a reliable comparison.' },
  { status: 'UNVERIFIABLE', expected: 18, observed: 14, quality: 0.58, confidence: 0.39, stability: 0.48, occlusion: 'high', reason: 'Multiple obstructions in camera field-of-view. Aggregate count unreliable.' },
  { status: 'CAMERA_UNHEALTHY', expected: 16, observed: 0, quality: 0.08, confidence: 0, stability: 0, occlusion: 'low', reason: 'Camera CAM-012 is offline. No video signal available for occupancy estimation.' },
  { status: 'CAMERA_UNHEALTHY', expected: 14, observed: 0, quality: 0.12, confidence: 0, stability: 0, occlusion: 'low', reason: 'Camera feed is frozen since 14:20. Edge device reports storage failure.' },
  { status: 'REVIEW_REQUIRED', expected: 20, observed: 7, quality: 0.91, confidence: 0.88, stability: 0.9, occlusion: 'low', reason: 'Observed occupancy (7) is significantly below biometric expected (20). High-confidence video signal suggests a substantive gap requiring human review.' },
  { status: 'REVIEW_REQUIRED', expected: 25, observed: 11, quality: 0.89, confidence: 0.86, stability: 0.87, occlusion: 'low', reason: 'Only 11 occupants detected against 25 biometric check-ins. Camera quality and confidence are high.' },
  { status: 'REVIEW_REQUIRED', expected: 18, observed: 5, quality: 0.93, confidence: 0.91, stability: 0.92, occlusion: 'low', reason: 'Major discrepancy: 5 observed vs 18 expected. Detection metrics are reliable.' },
  { status: 'CONFIRMED_BY_REVIEWER', expected: 22, observed: 8, quality: 0.9, confidence: 0.87, stability: 0.89, occlusion: 'low', reason: 'Confirmed discrepancy after field inspection by district inspector.' },
  { status: 'DISMISSED_BY_REVIEWER', expected: 19, observed: 12, quality: 0.85, confidence: 0.82, stability: 0.79, occlusion: 'medium', reason: 'Reviewer noted that trainees were in adjacent practical workshop during observation window.' },
  { status: 'NO_DEFICIT_DETECTED', expected: 24, observed: 23, quality: 0.92, confidence: 0.9, stability: 0.94, occlusion: 'low', reason: 'Aggregate occupancy consistent with biometric records.' },
  { status: 'WITHIN_CAMERA_TOLERANCE', expected: 17, observed: 15, quality: 0.87, confidence: 0.83, stability: 0.86, occlusion: 'medium', reason: 'Difference of 2 with medium occlusion is within acceptable range.' },
]

export const reconciliations: AttendanceReconciliation[] = reconStatuses.map((r, i) => {
  const c = centres[i % centres.length]
  const batchIdx = i % 6
  return {
    id: `REC-${String(3001 + i).padStart(4, '0')}`,
    centreId: c.id,
    centreName: c.name,
    batchId: `BAT-${batchIdx + 1}`,
    batchName: `Batch ${String(batchIdx + 1).padStart(2, '0')} · ${['Electrical', 'Fitter', 'Welding'][i % 3]}`,
    roomName: `Workshop ${(i % 3) + 1}`,
    observedAt: `2026-10-${String(7 - (i % 5)).padStart(2, '0')}T${String(9 + (i % 6)).padStart(2, '0')}:${String(15 + (i % 4) * 10).padStart(2, '0')}:00Z`,
    expectedPresent: r.expected,
    biometricCheckIns: r.expected + Math.floor(i % 3),
    biometricCheckOuts: Math.floor(i % 3),
    observedMedian: r.observed,
    cameraQualityScore: r.quality,
    detectionConfidence: r.confidence,
    countStability: r.stability,
    occlusionRisk: r.occlusion,
    status: r.status,
    reason: r.reason,
    evidence: [
      { type: 'snapshot' as const, url: '/placeholder.jpg', capturedAt: `2026-10-${String(7 - (i % 5)).padStart(2, '0')}T${String(9 + (i % 6)).padStart(2, '0')}:15:00Z` },
      { type: 'clip' as const, url: '/placeholder.jpg', capturedAt: `2026-10-${String(7 - (i % 5)).padStart(2, '0')}T${String(9 + (i % 6)).padStart(2, '0')}:20:00Z` },
    ],
    reviewer: r.status === 'CONFIRMED_BY_REVIEWER'
      ? { name: 'A. Sharma', decision: 'CONFIRMED' as const, note: 'Confirmed after on-site inspection. Centre operator acknowledged gap.', decidedAt: '2026-10-08T14:30:00Z' }
      : r.status === 'DISMISSED_BY_REVIEWER'
      ? { name: 'M. Iyer', decision: 'DISMISSED' as const, note: 'Trainees were in adjacent workshop for practical session — attendance valid.', decidedAt: '2026-10-08T11:15:00Z' }
      : undefined,
    state: c.state,
    district: c.district,
  }
})

const deviceSources = ['AEBAS', 'RFID', 'FINGERPRINT_VENDOR', 'DEMO'] as const
export const biometricDevices: BiometricDevice[] = centres.map((c, i) => ({
  id: `BIO-${String(i + 1).padStart(3, '0')}`,
  centreId: c.id,
  centreName: c.name,
  source: deviceSources[i % 4],
  lastSuccessfulSync: i === 5 ? '2026-10-07T06:40:00Z' : i === 8 ? '2026-10-06T22:10:00Z' : '2026-10-09T10:05:00Z',
  delayedEvents: i === 5 ? 14 : i === 8 ? 23 : i % 4 === 0 ? 2 : 0,
  offlineEvents: i === 8 ? 8 : 0,
  health: (i === 8 ? 'offline' : i === 5 ? 'delayed' : 'healthy') as 'healthy' | 'delayed' | 'offline',
  state: c.state,
  district: c.district,
}))

const tokenRefs = ['TRN-•••A91', 'TRN-•••B42', 'TRN-•••C73', 'TRN-•••D18', 'TRN-•••E56', 'TRN-•••F29', 'TRN-•••G84', 'TRN-•••H05', 'TRN-•••J37', 'TRN-•••K62']
export const biometricEvents: BiometricEvent[] = tokenRefs.flatMap((ref, i) => {
  const c = centres[i % centres.length]
  return [
    { id: `EVT-${2 * i + 1}`, tokenisedTraineeRef: ref, source: deviceSources[i % 4], deviceId: `BIO-${String((i % 12) + 1).padStart(3, '0')}`, eventType: 'CHECK_IN' as const, timestamp: `2026-10-07T09:0${i % 6}:00Z`, centreId: c.id, batchId: `BAT-${(i % 6) + 1}`, syncStatus: 'synced' as const, createdAt: '2026-10-07T09:00:00Z' },
    { id: `EVT-${2 * i + 2}`, tokenisedTraineeRef: ref, source: deviceSources[i % 4], deviceId: `BIO-${String((i % 12) + 1).padStart(3, '0')}`, eventType: 'CHECK_OUT' as const, timestamp: `2026-10-07T13:0${i % 6}:00Z`, centreId: c.id, batchId: `BAT-${(i % 6) + 1}`, syncStatus: 'synced' as const, createdAt: '2026-10-07T13:00:00Z' },
  ]
})

export const videoJobs: VideoAnalysisJob[] = [
  { id: 'VJ-001', centreId: 'CTR-001', batchId: 'BAT-1', videoRef: 's3://skillguard-video/ctr001-bat1-20261007.mp4', status: 'COMPLETED', result: { observedMedian: 19.5, detectionConfidence: 0.92, countStability: 0.95, occlusionRisk: 'low' }, submittedAt: '2026-10-07T09:25:00Z', completedAt: '2026-10-07T09:27:00Z' },
  { id: 'VJ-002', centreId: 'CTR-003', batchId: 'BAT-3', videoRef: 's3://skillguard-video/ctr003-bat3-20261007.mp4', status: 'PROCESSING', submittedAt: '2026-10-07T10:30:00Z' },
  { id: 'VJ-003', centreId: 'CTR-009', batchId: 'BAT-2', videoRef: 's3://skillguard-video/ctr009-bat2-20261007.mp4', status: 'FAILED', submittedAt: '2026-10-07T11:00:00Z' },
]
