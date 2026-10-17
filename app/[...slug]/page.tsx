'use client'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Bell, ChevronRight, ChevronLeft, ChevronDown, CircleAlert, ClipboardCheck, CloudOff, FileBarChart, Gauge, LayoutDashboard, LayoutGrid, Home, Menu, Search, Settings, ShieldCheck, Video, X, Users, Activity, Download, ArrowRight, ArrowUpRight, Filter, RefreshCw, UserPlus, Trash2, MapPin, Building2, Fingerprint, Cpu, CheckCircle2, XCircle, AlertTriangle, Eye, Clock, Wifi, WifiOff, Send, Info, Plus } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { endpoints } from '@/lib/api'
import type { Centre, ComplianceCase, DashboardSummary, CentreDetail, AttendanceRecord, InventoryItem, Camera, AttendanceReconciliation, BiometricDevice, ReconciliationStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Film } from 'lucide-react'
import { DemoPage } from '@/components/demo-page'

const nav = [
  ['demo', 'Live Monitoring', Video],
  ['dashboard', 'Command Centre', LayoutDashboard],
  ['centres', 'Centres', Building2],
  ['attendance', 'LensAttend', Fingerprint],
  ['infrastructure', 'Infrastructure', Gauge],
  ['cases', 'Alerts & Cases', AlertTriangle],
  ['reports', 'Reports', FileBarChart],
  ['camera-health', 'Camera Health', Activity],
  ['settings', 'Settings', Settings],
] as const

const tone = (s:string) => s.toLowerCase().includes('critical')||s==='high'||s==='review_required'?'red':s.toLowerCase().includes('potential')||s==='medium'||s==='unverifiable'||s==='camera_unhealthy'?'amber':s.toLowerCase().includes('unverifiable')||s.includes('offline')?'slate':s==='within_camera_tolerance'?'blue':'teal'
const reconTone = (s:ReconciliationStatus) => { switch(s){ case 'REVIEW_REQUIRED': return 'red'; case 'UNVERIFIABLE': case 'CAMERA_UNHEALTHY': return 'amber'; case 'WITHIN_CAMERA_TOLERANCE': return 'blue'; case 'CONFIRMED_BY_REVIEWER': return 'red'; case 'DISMISSED_BY_REVIEWER': return 'slate'; default: return 'teal' } }
const reconLabel = (s:ReconciliationStatus) => s.replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase())
const reconIcon = (s:ReconciliationStatus) => { switch(s){ case 'NO_DEFICIT_DETECTED': return CheckCircle2; case 'WITHIN_CAMERA_TOLERANCE': return CheckCircle2; case 'REVIEW_REQUIRED': return AlertTriangle; case 'UNVERIFIABLE': return Eye; case 'CAMERA_UNHEALTHY': return WifiOff; case 'CONFIRMED_BY_REVIEWER': return XCircle; case 'DISMISSED_BY_REVIEWER': return CheckCircle2; default: return CircleAlert } }
function ReconBadge({status}:{status:ReconciliationStatus}){ const Icon=reconIcon(status); return <span className={`badge ${reconTone(status)}`}><Icon size={11}/> {reconLabel(status)}</span> }
function Badge({children}:{children:string}){ return <span className={`badge ${tone(children)}`}>{children}</span> }
function Stat({label,value,sub,icon:Icon,tone='blue'}:{label:string;value:string|number;sub:string;icon:any;tone?:string}){ return <div className="stat"><div className={`stat-icon ${tone}`}><Icon size={17}/></div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div></div> }

function LionCapitalEmblem({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.25)} viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="State Emblem of India">
      {/* Central Lion Head */}
      <path d="M25 13C25 7.5 28 5 32 5C36 5 39 7.5 39 13C39 15.5 40.5 17.5 42 18.5C41 22.5 37.5 25 32 25C26.5 25 23 22.5 22 18.5C23.5 17.5 25 15.5 25 13Z" fill="#F1F5F9" fillOpacity="0.95"/>
      {/* Left Lion Head & Mane */}
      <path d="M16 18C14.5 15 15.5 10 18.5 8C20.5 11 20.5 14 22.5 17C19.5 19 17.5 21 16 24C14.5 22 14.5 20 16 18Z" fill="#CBD5E1" fillOpacity="0.85"/>
      {/* Right Lion Head & Mane */}
      <path d="M48 18C49.5 15 48.5 10 45.5 8C43.5 11 43.5 14 41.5 17C44.5 19 46.5 21 48 24C49.5 22 49.5 20 48 18Z" fill="#CBD5E1" fillOpacity="0.85"/>
      {/* Central Lion Eyes & Muzzle */}
      <circle cx="29.5" cy="12.5" r="1.3" fill="#0F263A"/>
      <circle cx="34.5" cy="12.5" r="1.3" fill="#0F263A"/>
      <path d="M31 15.5L32 17L33 15.5" stroke="#0F263A" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M29 19.5C30.5 21 33.5 21 35 19.5" stroke="#0F263A" strokeWidth="0.8" strokeLinecap="round"/>
      {/* Lions Body & Main Mane */}
      <path d="M18 24C16 29 17 35 20 39C22 42.5 25 45.5 28 47L28 52L36 52L36 47C39 45.5 42 42.5 44 39C47 35 48 29 46 24C44 26 42 27 39 27.5C37 28.5 35 29.5 32 29.5C29 29.5 27 28.5 25 27.5C22 27 20 26 18 24Z" fill="#E2E8F0" fillOpacity="0.95"/>
      {/* Mane details */}
      <path d="M24 31C26 34 29 37 32 37.5C35 37 38 34 40 31" stroke="#0F263A" strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
      <path d="M22 36C25 40 28 42 32 42.5C36 42 39 40 42 36" stroke="#0F263A" strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
      {/* Abacus frieze */}
      <rect x="13" y="52" width="38" height="10" rx="1.5" fill="#F8FAFC" fillOpacity="0.95"/>
      {/* Ashoka Chakra in center */}
      <circle cx="32" cy="57" r="4.3" stroke="#0F263A" strokeWidth="1.1" fill="none"/>
      <circle cx="32" cy="57" r="1.2" fill="#0F263A"/>
      <line x1="32" y1="53" x2="32" y2="61" stroke="#0F263A" strokeWidth="0.7"/>
      <line x1="28" y1="57" x2="36" y2="57" stroke="#0F263A" strokeWidth="0.7"/>
      <line x1="29.2" y1="54.2" x2="34.8" y2="59.8" stroke="#0F263A" strokeWidth="0.7"/>
      <line x1="29.2" y1="59.8" x2="34.8" y2="54.2" stroke="#0F263A" strokeWidth="0.7"/>
      {/* Silhouettes on abacus */}
      <circle cx="19" cy="57" r="1.8" fill="#0F263A" opacity="0.65"/>
      <circle cx="45" cy="57" r="1.8" fill="#0F263A" opacity="0.65"/>
      {/* Stepped Pedestal Base */}
      <rect x="11" y="62" width="42" height="3" rx="0.5" fill="#CBD5E1"/>
      <rect x="15" y="65" width="34" height="3" rx="0.5" fill="#94A3B8"/>
      {/* Lotus Bell Pedestal Arch */}
      <path d="M19 68C23 72 41 72 45 68" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function Shell({children,title,crumb,hideHeading}:{children:React.ReactNode;title:string;crumb?:string;hideHeading?:boolean}){
  const [open,setOpen] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [revealed,setRevealed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'National Admin';
  const goBack = () => { if(typeof window !== 'undefined' && window.history.length > 1) window.history.back(); else if(typeof window !== 'undefined') window.location.href = '/dashboard'; };

  return (
    <div className={collapsed ? `app-shell nav-collapsed${revealed ? ' nav-revealed' : ''}` : 'app-shell'}>
      <aside onMouseEnter={() => collapsed && setRevealed(true)} onMouseLeave={() => collapsed && setRevealed(false)} className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark-logo">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 4L30 11L18 18L6 11L18 4Z" fill="#0284C7" />
              <path d="M18 18L30 11V25L18 32V18Z" fill="#10B981" />
              <path d="M6 11L18 18V32L6 25V11Z" fill="#EA580C" />
              <circle cx="18" cy="18" r="4.5" fill="#0F172A" />
              <circle cx="18" cy="18" r="2.2" fill="#38BDF8" />
            </svg>
          </div>
          <div><b>Kaushal Lens</b><span>MSDE - SKILL CENTRE MONITORING</span></div>
          <button className="mobile-close" onClick={() => setOpen(false)}><X size={18}/></button>
        </div>
        <nav>
          {nav.map(([href, label, Icon]) => (
            <a key={href} href={'/' + href} className={pathname.includes(href) ? 'active' : ''} title={label}>
              <Icon size={17}/>
              <span>{label}</span>
              {href === 'cases' && <em>22</em>}
            </a>
          ))}
        </nav>

        {/* Four Lion Statue & Ministry Name */}
        <div className="sidebar-emblem-section">
          <div className="emblem-card">
            <div className="emblem-graphic">
              <LionCapitalEmblem size={28}/>
            </div>
            <div className="emblem-info">
              <b>Ministry of Skill Development and Entrepreneurship</b>
              <span>Government of India</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="system-status"><span className="dot"/>All systems operational</div>
          <div className="user-mini">
            <div className="avatar">AS</div>
            <div><b>Arjun Sharma</b><span>{role}</span></div>
            <ChevronRight size={15}/>
          </div>
        </div>
        <button className="nav-toggle" onClick={() => { setCollapsed(!collapsed); setRevealed(false); }} aria-label={collapsed ? 'Expand navigation' : 'Collapse sidebar'} title={collapsed ? 'Expand navigation' : 'Collapse sidebar'}>
          <ChevronLeft size={16}/><span>{collapsed ? 'Expand' : 'Collapse'} sidebar</span>
        </button>
      </aside>

      <div className="content">
        <header>
          <button className="menu" onClick={() => setOpen(true)}><Menu size={20}/></button>
          <div className="crumb"><span>Kaushal Lens</span><ChevronRight size={14}/><b>{crumb || title}</b></div>
          <div className="header-actions">
            <div className="search"><Search size={16}/><input placeholder="Search centres, batches, or cases..."/></div>
            <button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button>
            <div className="avatar">AS</div>
          </div>
        </header>
        <main>
          {!hideHeading && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">NATIONAL MONITORING PROGRAMME</p>
                <h1>{title}</h1>
                <p className="muted">Privacy-preserving compliance oversight across vocational training centres.</p>
              </div>
              <div className="heading-actions">
                <span className="live-pill"><span className="dot"/>Data synced 3 min ago</span>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function Dashboard(){
  const [data,setData] = useState<DashboardSummary|null>(null);
  const [reconData,setReconData] = useState<AttendanceReconciliation[]>([]);
  const [stateFilter,setStateFilter] = useState('All India');
  const [range,setRange] = useState('Last 7 days');
  const [refreshing,setRefreshing] = useState(false);

  useEffect(()=>{
    endpoints.summary().then(setData as any);
    endpoints.reconciliations().then(setReconData as any);
  },[]);

  const refresh = async () => {
    setRefreshing(true);
    const next = await endpoints.summary();
    setData(next as DashboardSummary);
    const nextRecon = await endpoints.reconciliations();
    setReconData(nextRecon as AttendanceReconciliation[]);
    setTimeout(()=>setRefreshing(false), 450);
  };

  if(!data) return <Shell title="Command centre"><div className="loading">Loading operational summary...</div></Shell>;

  const visibleCentres = stateFilter === 'All India' ? data.centres : data.centres.filter(c => c.state === stateFilter);
  const visibleCases = data.cases.filter(c => stateFilter === 'All India' || c.state === stateFilter);
  const states = Array.from(new Set(data.centres.map(c => c.state)));
  const reconReview = reconData.filter(r => r.status === 'REVIEW_REQUIRED').length;
  const reconUnverifiable = reconData.filter(r => r.status === 'UNVERIFIABLE' || r.status === 'CAMERA_UNHEALTHY').length;
  const reconVerified = reconData.filter(r => r.status === 'NO_DEFICIT_DETECTED' || r.status === 'WITHIN_CAMERA_TOLERANCE').length;
  const reconChartData = reconData.slice(0, 8).map(r => ({ batch: r.batchName.split('·')[0].trim(), biometric: r.expectedPresent, video: r.observedMedian }));

  return (
    <Shell title="Command centre">
      {/* State-wise Forms & Filter Toolbar */}
      <div className="toolbar">
        <div className="filters" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {/* State-wise select form */}
          <div className="form-select-control">
            <span className="flag-icon">🇮🇳</span>
            <select value={stateFilter} onChange={e=>setStateFilter(e.target.value)} aria-label="Filter by state">
              <option value="All India">All India</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="select-caret"/>
          </div>

          {/* Quick state buttons */}
          <button className={stateFilter==='All India'?'filter active':'filter'} onClick={()=>setStateFilter('All India')}>All India</button>
          {states.slice(0,4).map(state => (
            <button key={state} className={stateFilter===state?'filter active':'filter'} onClick={()=>setStateFilter(state)}>{state}</button>
          ))}

          {/* Date range select form */}
          <div className="form-select-control">
            <Clock size={13} style={{color:'var(--muted)'}}/>
            <select value={range} onChange={e=>setRange(e.target.value)} aria-label="Select date range">
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
            </select>
            <ChevronDown size={14} className="select-caret"/>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw data-icon="inline-start" className={refreshing?'spin':''}/> {refreshing?'Syncing…':'Refresh data'}
        </Button>
      </div>

      {/* Scope Note */}
      <div className="scope-note">
        <span className="dot"/>
        <b>{stateFilter}</b>
        <span>{visibleCentres.length} centres · {visibleCases.length} cases in view</span>
        {stateFilter !== 'All India' && (
          <button onClick={() => setStateFilter('All India')}>Clear scope</button>
        )}
      </div>

      {/* 5 KPI Stat Cards in Original Grid */}
      <div className="stats-grid">
        <Stat label="Active centres" value={visibleCentres.length} sub={`Across ${new Set(visibleCentres.map(c=>c.state)).size} states`} icon={ShieldCheck} tone="teal"/>
        <Stat label="Camera health" value={`${data.totals.camerasHealthy}/${data.totals.camerasTotal}`} sub="80% healthy" icon={Video} tone="blue"/>
        <Stat label="Active batches" value={data.totals.activeBatches} sub="Currently reporting" icon={Users} tone="indigo"/>
        <Stat label="Open cases" value={visibleCases.length} sub="3 critical priority" icon={ClipboardCheck} tone="amber"/>
        <Stat label="Offline centres" value={data.totals.offlineCentres} sub="Needs attention" icon={CloudOff} tone="red"/>
      </div>

      {/* Middle Row: Trend Chart (Left 2/3) + Alert Severity Donut (Right 1/3) */}
      <div className="grid-2-1">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h2>Discrepancy trend</h2>
              <p>Aggregate observations vs reported data · {range}</p>
            </div>
            <a className="more" href="/attendance">View analytics <ArrowUpRight size={14}/></a>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.attendanceTrend}>
                <defs>
                  <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b8f87" stopOpacity={0.28}/>
                    <stop offset="100%" stopColor="#0b8f87" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e9eef2" vertical={false}/>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:12,fill:'#718096'}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:12,fill:'#718096'}}/>
                <Tooltip/>
                <Area type="monotone" dataKey="discrepancies" stroke="#0b8f87" fill="url(#tealFill)" strokeWidth={2} name="Discrepancies"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Alert severity</h2>
              <p>Current open cases</p>
            </div>
            <a className="more" href="/cases">View all <ArrowUpRight size={14}/></a>
          </div>
          <div className="donut">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.severity} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3}>
                  {data.severity.map((x,i)=><Cell key={i} fill={x.fill}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <b>{visibleCases.length || 28}</b>
              <span>Total</span>
            </div>
          </div>
          <div className="legend">
            {data.severity.map(x=>(
              <div key={x.name}>
                <i style={{background:x.fill}}/>
                <span>{x.name}</span>
                <b>{x.value}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Attendance Reconciliation Section */}
      {reconData.length > 0 && (
        <section className="panel recon-dashboard-section">
          <div className="panel-head">
            <div>
              <h2>Attendance reconciliation</h2>
              <p>Biometric check-in vs aggregate video occupancy · Privacy-preserving compliance</p>
            </div>
            <a className="more" href="/attendance-reconciliation">View all <ArrowUpRight size={14}/></a>
          </div>
          <div className="stats-grid" style={{marginBottom:16}}>
            <Stat label="Batches verified" value={reconVerified} sub="No deficit or within tolerance" icon={CheckCircle2} tone="teal"/>
            <Stat label="Review required" value={reconReview} sub="Human review pending" icon={AlertTriangle} tone="red"/>
            <Stat label="Unverifiable" value={reconUnverifiable} sub="Camera issue or occlusion" icon={Eye} tone="amber"/>
            <Stat label="Device sync health" value={`${reconData.length > 0 ? Math.round((reconData.filter(r=>r.cameraQualityScore>0.5).length/reconData.length)*100) : 0}%`} sub="Devices syncing normally" icon={Wifi} tone="blue"/>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reconChartData}>
                <CartesianGrid stroke="#e9eef2" vertical={false}/>
                <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#718096'}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#718096'}}/>
                <Tooltip/>
                <Bar dataKey="biometric" fill="#1a5672" radius={[4,4,0,0]} name="Biometric expected"/>
                <Bar dataKey="video" fill="#0b8f87" radius={[4,4,0,0]} name="Video observed"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="privacy-banner" style={{marginTop:14}}>
            <ShieldCheck size={16}/>
            <div>
              <b>Privacy boundary</b>
              <p>Video estimates aggregate occupancy only. It does not identify trainees. The biometric system is the identity source of truth.</p>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Row: Centre Risk Ranking (Left 1.5) + Needs Attention Now (Right 1) */}
      <div className="grid-1-1">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Centre risk ranking</h2>
              <p>Centres requiring review, ordered by compliance score</p>
            </div>
            <a className="more" href="/centres">View all <ArrowUpRight size={14}/></a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Centre</th>
                <th>State</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleCentres.slice(0,6).map(c => (
                <tr key={c.id}>
                  <td>
                    <a className="table-link" href={`/centres/${c.id}`}>{c.name}</a>
                    <small>{c.id} · {c.openCases} open cases</small>
                  </td>
                  <td>{c.state}</td>
                  <td>
                    <strong className={c.score < 70 ? 'score-low' : ''}>{c.score}</strong>
                    <div className="progress">
                      <i style={{width:`${c.score}%`}}/>
                    </div>
                  </td>
                  <td><Badge>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Needs attention now</h2>
              <p>Priority signals from the last sync</p>
            </div>
            <a className="more" href="/cases">View all <ArrowUpRight size={14}/></a>
          </div>
          <div className="attention-list">
            {visibleCases.slice(0,5).map(c => (
              <a href={`/cases/${c.id}`} key={c.id} className="attention">
                <div className={`signal ${tone(c.severity)}`}>
                  <CircleAlert size={15}/>
                </div>
                <div>
                  <b>{c.title}</b>
                  <span>{c.centreName} · {c.createdAt.slice(5,10)}</span>
                </div>
                <ChevronRight size={15}/>
              </a>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
function Centres() {
  const [data, setData] = useState<Centre[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    state: 'Maharashtra',
    district: '',
    camerasTotal: 3,
    camerasHealthy: 3,
    status: 'Compliant' as const,
    score: 95,
  });

  const loadCentres = () => {
    endpoints.centres().then(setData as any);
  };

  useEffect(() => {
    loadCentres();
  }, []);

  const states = Array.from(new Set(data.map(c => c.state))).filter(Boolean);

  const filtered = data.filter(c => {
    const matchesQ = (c.name + ' ' + c.id + ' ' + c.state + ' ' + c.district).toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesState = stateFilter === 'All' || c.state === stateFilter;
    return matchesQ && matchesStatus && matchesState;
  });

  const handleAddCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.district.trim()) return;

    setIsSubmitting(true);
    try {
      const generatedId = form.id.trim() || `TC-${form.state.slice(0, 2).toUpperCase()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      await endpoints.addCentre({
        ...form,
        id: generatedId,
        camerasHealthy: Number(form.camerasHealthy),
        camerasTotal: Number(form.camerasTotal),
        score: Number(form.score),
      });

      setToastMessage(`Centre "${form.name}" (${generatedId}) successfully added! Connected to Command Centre.`);
      setTimeout(() => setToastMessage(null), 6000);
      setIsAddOpen(false);
      setForm({
        id: '',
        name: '',
        state: 'Maharashtra',
        district: '',
        camerasTotal: 3,
        camerasHealthy: 3,
        status: 'Compliant',
        score: 95,
      });
      loadCentres();
    } catch (err: any) {
      alert(`Error registering centre: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell title="Centres" crumb="Monitoring Scope / Centres">
      {toastMessage && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ border: 0, background: 'none', color: '#065f46', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="toolbar" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search wide">
            <Search size={16} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search centre, ID, state or district..."
            />
          </div>

          {/* Status filter */}
          <div className="form-select-control">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Camera Issue">Camera Issue</option>
              <option value="Unverifiable">Unverifiable</option>
            </select>
            <ChevronDown size={14} className="select-caret" />
          </div>

          {/* State filter */}
          <div className="form-select-control">
            <span style={{ fontSize: 13 }}>🇮🇳</span>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              aria-label="Filter by state"
            >
              <option value="All">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="select-caret" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} data-icon="inline-start" /> Add Centre
          </Button>
        </div>
      </div>

      <section className="panel">
        <div className="table-meta">
          <span>
            <b>{filtered.length}</b> centres in monitoring scope
            {stateFilter !== 'All' && <span> in <b>{stateFilter}</b></span>}
            {statusFilter !== 'All' && <span> with status <b>{statusFilter}</b></span>}
          </span>
          <span className="privacy-note">
            <ShieldCheck size={14} /> Synced with Command Centre & Edge AI
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Centre</th>
              <th>State / District</th>
              <th>Status</th>
              <th>Score</th>
              <th>Open cases</th>
              <th>Camera health</th>
              <th>Live footage</th>
              <th>Last sync</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  No centres match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <a className="table-link" href={`/centres/${c.id}`}>{c.name}</a>
                    <small>{c.id}</small>
                  </td>
                  <td>
                    {c.state}
                    <small>{c.district}</small>
                  </td>
                  <td><Badge>{c.status}</Badge></td>
                  <td>
                    <strong className={c.score < 70 ? 'score-low' : ''}>
                      {c.score}/100
                    </strong>
                  </td>
                  <td>{c.openCases || '—'}</td>
                  <td>{c.camerasHealthy}/{c.camerasTotal} healthy</td>
                  <td>
                    <a
                      href={`/demo?centre=${encodeURIComponent(c.id)}`}
                      className="more"
                      style={{ fontWeight: 600, color: '#0b8f87' }}
                    >
                      <Video size={13} /> Monitor footage
                    </a>
                  </td>
                  <td>{c.lastSync}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Add Centre Modal Dialog */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsAddOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Register New Skill Centre</h3>
                <p>Onboard a training facility into the live MSDE KaushalLens network</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCentre}>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    Centre ID (Optional)
                    <input
                      placeholder="e.g. TC-GJ-0089 (auto if empty)"
                      value={form.id}
                      onChange={e => setForm({ ...form, id: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label>
                    State *
                    <select
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      required
                    >
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Haryana">Haryana</option>
                    </select>
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Centre Name *
                    <input
                      placeholder="e.g. Ahmedabad Advanced Tech Skills Hub"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    District *
                    <input
                      placeholder="e.g. Ahmedabad"
                      value={form.district}
                      onChange={e => setForm({ ...form, district: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Total CCTV Cameras
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={form.camerasTotal}
                      onChange={e => {
                        const tot = Number(e.target.value);
                        setForm({
                          ...form,
                          camerasTotal: tot,
                          camerasHealthy: Math.min(form.camerasHealthy, tot),
                        });
                      }}
                    />
                  </label>
                  <label>
                    Healthy Cameras
                    <input
                      type="number"
                      min={0}
                      max={form.camerasTotal}
                      value={form.camerasHealthy}
                      onChange={e => setForm({ ...form, camerasHealthy: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Initial Status
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as any })}
                    >
                      <option value="Compliant">Compliant</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Camera Issue">Camera Issue</option>
                      <option value="Unverifiable">Unverifiable</option>
                    </select>
                  </label>
                  <label>
                    Initial Compliance Score (0-100)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.score}
                      onChange={e => setForm({ ...form, score: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="privacy-banner" style={{ margin: 0 }}>
                  <ShieldCheck size={18} />
                  <div>
                    <b>Instant Live Connectivity</b>
                    <p>New centres are dynamically indexed across all Command Centre KPI aggregates, State filters, and Risk ranking queues.</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering…' : 'Save & Register Centre'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
function CentrePage({id}:{id:string}){const [d,setD]=useState<CentreDetail|null>(null); const [tab,setTab]=useState('Overview'); useEffect(()=>{endpoints.centre(id).then(setD as any)},[id]); if(!d)return <Shell title="Centre profile"><div className="loading">Loading centre profile...</div></Shell>; return <Shell title="Centre profile" crumb="Centres / Profile"><div className="profile-head"><div><div className="eyebrow">{d.id} · {d.state.toUpperCase()}</div><h2>{d.name}</h2><p className="muted">{d.address} · Centre manager: {d.manager}</p></div><Badge>{d.status}</Badge></div><div className="profile-score"><div><span>Compliance score</span><strong>{d.score}<small>/100</small></strong></div><div className="score-bar"><i style={{width:`${d.score}%`}}/></div><span className="muted">Based on latest verified observations</span></div><div className="tabs">{['Overview','Batches','Attendance','Infrastructure','Cameras','Cases','Audit history'].map(x=><button className={tab===x?'selected':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>{tab==='Infrastructure'?<section className="panel"><div className="panel-head"><div><h2>Expected vs observed inventory</h2><p>Unverifiable is not absent. Items with low evidence quality require manual review.</p></div></div><table><thead><tr><th>Item</th><th>Room</th><th>Expected</th><th>Observed</th><th>Assessment</th></tr></thead><tbody>{d.inventory.map((x,i)=><tr key={i}><td><b>{x.item}</b></td><td>{x.room}</td><td>{x.expected}</td><td>{x.observed}</td><td><Badge>{x.status}</Badge></td></tr>)}</tbody></table></section>:tab==='Cameras'?<div className="camera-grid">{d.cameras.map(c=><CameraCard key={c.id} camera={c}/>)}</div>:<div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2>{tab==='Batches'?'Active batches':'Centre overview'}</h2><p>{tab==='Batches'?'Reported attendance and live occupancy':'Latest centre signals and operational summary'}</p></div></div>{tab==='Batches'?d.batches.map(b=><div className="batch-row" key={b.id}><div><b>{b.name} · {b.trade}</b><span>{b.schedule}</span></div><div><b>{b.observed}/{b.reported}</b><span>observed / reported</span></div><Badge>{b.status}</Badge></div>):<><div className="overview-grid"><Stat label="Active batches" value="3" sub="18 learners reporting" icon={Users}/><Stat label="Camera health" value={`${d.camerasHealthy}/${d.camerasTotal}`} sub="Latest device check" icon={Video}/><Stat label="Open cases" value={d.openCases} sub="Across all categories" icon={ClipboardCheck}/></div><div className="timeline">{d.timeline.map(x=><div key={x.date}><i className={`timeline-dot ${x.tone}`}/><div><b>{x.text}</b><span>{x.date}</span></div></div>)}</div></>}</section><section className="panel map-card"><div className="regional-map"><div className="map-grid"/><div className="map-pin p1"/><div className="map-pin p2"/><div className="map-pin p3"/></div><h3>Regional network</h3><p className="muted">Connected to the {d.state} monitoring region</p><div className="sync-line"><span className="dot"/> Edge device online <b>v2.8.4</b></div></section></div>}</Shell>}
function CameraCard({camera}:{camera:Camera}){return <div className="camera-card"><div className={`camera-preview ${camera.status}`}><div className="scanline"/><span>{camera.status==='healthy'?`${camera.people} people detected`:`${camera.status.toUpperCase()}`}</span><small>{camera.room}</small></div><div className="camera-info"><div><b>{camera.id}</b><span>{camera.room} · Quality {camera.quality}%</span></div><Badge>{camera.status==='healthy'?'Healthy':'Camera unhealthy'}</Badge></div><div className="camera-foot"><span>Last sync {camera.lastSync}</span><button className="more">View evidence <ArrowUpRight size={13}/></button></div></div>}
function Cases(){const [data,setData]=useState<ComplianceCase[]>([]);const [q,setQ]=useState('');useEffect(()=>{endpoints.cases().then(setData as any)},[]);const f=data.filter(c=>(c.id+c.title+c.centreName+c.category).toLowerCase().includes(q.toLowerCase()));return <Shell title="Case queue"><div className="toolbar"><div className="search wide"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search case ID, centre or category"/></div><div className="filters"><button className="filter">All statuses</button><button className="filter">All severity</button></div></div><section className="panel"><div className="table-meta"><span><b>{f.length}</b> cases · Human review queue</span><span className="privacy-note"><ShieldCheck size={14}/> No identity data is collected</span></div><table><thead><tr><th>Case ID / issue</th><th>Severity</th><th>Category</th><th>Centre</th><th>Created</th><th>Assignee</th><th>Status</th></tr></thead><tbody>{f.map(c=><tr key={c.id}><td><a className="table-link" href={`/cases/${c.id}`}>{c.id}</a><small>{c.title}</small></td><td><Badge>{c.severity}</Badge></td><td className="capitalize">{c.category.replace('_',' ')}</td><td>{c.centreName}<small>{c.district}, {c.state}</small></td><td>{c.createdAt.slice(0,10)}</td><td>{c.assignedTo||<span className="muted">Unassigned</span>}</td><td><Badge>{c.status.replace('_',' ')}</Badge></td></tr>)}</tbody></table></section></Shell>}
function CasePage({id}:{id:string}){const [c,setC]=useState<ComplianceCase|null>(null);const [note,setNote]=useState('');useEffect(()=>{endpoints.case(id).then(setC as any)},[id]);if(!c)return <Shell title="Case review"><div className="loading">Loading case...</div></Shell>;const action=async(label:string)=>{await fetch(`/api/cases/${id}/review`,{method:'POST',body:JSON.stringify({action:label,note})});setC({...c,status:label==='Close case'?'closed':label==='Mark verified discrepancy'?'resolved':'under_review'});};return <Shell title="Case review" crumb={`Case queue / ${c.id}`}><div className="case-title"><div><div className="eyebrow">{c.id} · CREATED {c.createdAt.slice(0,10)}</div><h2>{c.title}</h2><p className="muted">{c.centreName} · {c.roomName} · {c.batchName}</p></div><Badge>{c.severity}</Badge></div><div className="case-layout"><div className="case-main"><section className="panel"><div className="section-label">EVIDENCE REVIEW</div><div className="evidence-frame"><div className="evidence-overlay"><span>SIMULATED EVIDENCE FRAME</span><b>{c.observedValue||'—'} aggregate occupants</b><small>Camera snapshot · {c.evidenceQuality} quality</small></div><div className="evidence-box"/></div><div className="evidence-meta"><span>Evidence hash <code>sha256: 84bf...9a21</code></span><span className="privacy-note"><ShieldCheck size={14}/> Aggregate observation only</span></div></section><section className="panel"><div className="section-label">EXPECTED VS OBSERVED</div><div className="comparison"><div><span>Reported / expected</span><strong>{c.expectedValue||'—'}</strong></div><div className="compare-arrow">→</div><div><span>Observed aggregate</span><strong>{c.observedValue||'—'}</strong></div><div className="confidence"><span>Confidence</span><strong>{Math.round(c.confidence*100)}%</strong><i><b style={{width:`${c.confidence*100}%`}}/></i></div></div><div className="reason"><CircleAlert size={17}/><div><b>Why this case was triggered</b><p>{c.triggerReason}</p></div></div></section><section className="panel"><div className="section-label">REVIEW NOTES</div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add context for the audit trail..."/><div className="panel-actions"><Button variant="outline" size="sm">Request centre response</Button><Button size="sm" onClick={()=>action('Mark verified discrepancy')}>Mark verified discrepancy</Button></div></section></div><aside className="case-aside"><section className="panel action-panel"><h3>Review actions</h3><p className="muted">Actions are recorded in the immutable audit trail.</p>{['Assign officer','Mark false alert','Mark insufficient evidence','Escalate for field inspection','Close case'].map(x=><button key={x} onClick={()=>action(x)} className="action-btn">{x}<ChevronRight size={15}/></button>)}</section><section className="panel"><div className="section-label">CASE DETAILS</div><dl><dt>Status</dt><dd><Badge>{c.status.replace('_',' ')}</Badge></dd><dt>Category</dt><dd className="capitalize">{c.category.replace('_',' ')}</dd><dt>Assigned to</dt><dd>{c.assignedTo||'Unassigned'}</dd><dt>SLA due</dt><dd>08 Oct 2026, 18:00</dd></dl></section></aside></div></Shell>}
function InfrastructureCompliancePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCentre, setSelectedCentre] = useState('All');
  const [q, setQ] = useState('');

  const fullInventory = useMemo(() => [
    { item: 'Electrical Wiring Assembly Workbench', category: 'Workbenches', room: 'Workshop 1 · Electrical', centre: 'Delhi Skill Development Centre (Class One 720P)', expected: 12, observed: 12, status: 'Compliant' as const, note: 'All stations active with voltage meters' },
    { item: 'Bench Vices & Fitter Workbench', category: 'Workbenches', room: 'Workshop 2 · Fitter', centre: 'Pune Vocational Training Centre', expected: 10, observed: 8, status: 'Potential discrepancy' as const, note: '2 workbenches missing in camera FOV' },
    { item: 'Precision Lathe Machine (All-geared)', category: 'Machinery', room: 'Machining Bay 1', centre: 'Pune Vocational Training Centre', expected: 4, observed: 4, status: 'Compliant' as const, note: 'Motors and safety guards detected' },
    { item: 'Industrial Sewing Machine Station', category: 'Machinery', room: 'Textile Room', centre: 'Ahmedabad Advanced Tech Skills Hub', expected: 15, observed: 15, status: 'Compliant' as const, note: 'Sewing tables verified present' },
    { item: 'TIG/MIG Welding Booth & Exhaust Unit', category: 'Machinery', room: 'Welding Bay', centre: 'Delhi Skill Development Centre', expected: 6, observed: 5, status: 'Potential discrepancy' as const, note: 'Booth #6 exhaust unit disconnected' },
    { item: 'Trainee Ergonomic Work Chairs', category: 'Seating', room: 'Classroom A', centre: 'Delhi Skill Development Centre', expected: 25, observed: 25, status: 'Compliant' as const, note: 'Sanctioned seating density compliant' },
    { item: 'Dual Student Seating Desks', category: 'Seating', room: 'Workshop 1', centre: 'Pune Vocational Training Centre', expected: 14, observed: 12, status: 'Potential discrepancy' as const, note: 'Deficit of 2 student desks' },
    { item: 'CO2 Dry Powder Fire Extinguisher (4kg)', category: 'Safety', room: 'Corridor & Workshop', centre: 'Delhi Skill Development Centre', expected: 4, observed: 4, status: 'Compliant' as const, note: 'Pressure gauge indicator in green' },
    { item: 'Emergency Eye-Wash & First-Aid Station', category: 'Safety', room: 'Safety Nook', centre: 'Pune Vocational Training Centre', expected: 2, observed: 1, status: 'Unverifiable' as const, note: 'Camera view obstructed by storage rack' },
    { item: 'Computer Lab Workstations (Core i5 / 16GB)', category: 'Machinery', room: 'IT Lab 1', centre: 'Bengaluru Skill Development Centre', expected: 20, observed: 20, status: 'Compliant' as const, note: 'All monitors and peripherals present' },
    { item: 'Soldering & De-soldering Workstation Kits', category: 'Workbenches', room: 'Electronics Lab', centre: 'Ahmedabad Advanced Tech Skills Hub', expected: 16, observed: 16, status: 'Compliant' as const, note: 'ESD-safe mats and irons detected' },
  ], []);

  const filtered = fullInventory.filter(item => {
    const matchesQ = (item.item + item.room + item.centre).toLowerCase().includes(q.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCentre = selectedCentre === 'All' || item.centre.includes(selectedCentre);
    return matchesQ && matchesCat && matchesCentre;
  });

  const totalSanctioned = fullInventory.reduce((acc, x) => acc + x.expected, 0);
  const totalObserved = fullInventory.reduce((acc, x) => acc + x.observed, 0);
  const totalDeficits = fullInventory.filter(x => x.status === 'Potential discrepancy').length;
  const totalUnverifiable = fullInventory.filter(x => x.status === 'Unverifiable').length;

  return (
    <Shell title="Infrastructure compliance" crumb="Monitoring Scope / Infrastructure">
      <div className="stats-grid">
        <Stat label="Sanctioned items" value={totalSanctioned} sub="Approved centre inventory" icon={Gauge} tone="blue"/>
        <Stat label="Observed present" value={totalObserved} sub={`${Math.round((totalObserved/totalSanctioned)*100)}% verified in FOV`} icon={CheckCircle2} tone="teal"/>
        <Stat label="Equipment gaps" value={totalDeficits} sub="Missing or dismantled items" icon={CircleAlert} tone="red"/>
        <Stat label="Unverifiable" value={totalUnverifiable} sub="Camera angle / obstructed" icon={Eye} tone="amber"/>
      </div>

      <div className="privacy-banner">
        <ShieldCheck size={19}/>
        <div>
          <b>Autonomous Sanctioned Inventory Audit</b>
          <p>The AI model (RF-DETR + Spatial Centroid Tracking) scans periodically for sanctioned equipment (workbenches, machinery, chairs, safety kits). Equipment absence or tampering triggers automated flags for the district inspection queue.</p>
        </div>
      </div>

      <div className="toolbar">
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',flex:1}}>
          <div className="search wide">
            <Search size={16}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search equipment, room or centre..."/>
          </div>

          <div className="form-select-control">
            <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} aria-label="Filter category">
              <option value="All">All Categories</option>
              <option value="Workbenches">Workbenches & Tables</option>
              <option value="Machinery">Core Machinery & Tools</option>
              <option value="Seating">Seating Capacity</option>
              <option value="Safety">Safety & Fire Compliance</option>
            </select>
            <ChevronDown size={14} className="select-caret"/>
          </div>

          <div className="form-select-control">
            <select value={selectedCentre} onChange={e=>setSelectedCentre(e.target.value)} aria-label="Filter centre">
              <option value="All">All Centres</option>
              <option value="Delhi">Delhi Skill Development Centre</option>
              <option value="Pune">Pune Vocational Training Centre</option>
              <option value="Ahmedabad">Ahmedabad Advanced Tech Skills Hub</option>
              <option value="Bengaluru">Bengaluru Skill Development Centre</option>
            </select>
            <ChevronDown size={14} className="select-caret"/>
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Download data-icon="inline-start"/> Export Inventory Audit CSV
        </Button>
      </div>

      <section className="panel">
        <div className="table-meta">
          <span><b>{filtered.length}</b> approved inventory lines in monitoring scope</span>
          <span className="privacy-note"><ShieldCheck size={14}/> Periodic CCTV verification</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Equipment Item / Type</th>
              <th>Centre & Room</th>
              <th>Sanctioned (Expected)</th>
              <th>AI Observed</th>
              <th>Variance</th>
              <th>Operability Assessment</th>
              <th>AI Detection Method</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const diff = item.expected - item.observed;
              return (
                <tr key={idx}>
                  <td>
                    <b>{item.item}</b>
                    <small className="muted">{item.category}</small>
                  </td>
                  <td>
                    {item.centre}
                    <small>{item.room}</small>
                  </td>
                  <td><strong>{item.expected}</strong></td>
                  <td><strong>{item.observed}</strong></td>
                  <td className={diff > 0 ? 'score-low' : ''}>
                    {diff > 0 ? `−${diff} missing` : '✓ Matches'}
                  </td>
                  <td><Badge>{item.status}</Badge></td>
                  <td>
                    <span className="muted" style={{fontSize:11}}>
                      RF-DETR Bounding + Centroid Lock
                    </span>
                  </td>
                  <td>
                    {diff > 0 ? (
                      <a href="/cases" className="more" style={{color:'#c14e4e',fontWeight:700}}>
                        Flag Case <ArrowUpRight size={13}/>
                      </a>
                    ) : (
                      <span className="muted">Verified</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

function ModelAccuracyAndReportsPage() {
  const [tab, setTab] = useState<'accuracy' | 'reports' | 'privacy'>('accuracy');

  return (
    <Shell title="Reports & AI Model Accuracy" crumb="Monitoring Scope / Accuracy & Reports">
      <div className="tabs">
        <button className={tab==='accuracy'?'selected':''} onClick={()=>setTab('accuracy')}>
          Demonstration Dataset Accuracy (Confusion Matrix)
        </button>
        <button className={tab==='privacy'?'selected':''} onClick={()=>setTab('privacy')}>
          Privacy-Preserving Design Note
        </button>
        <button className={tab==='reports'?'selected':''} onClick={()=>setTab('reports')}>
          Scheme Monitoring Reports
        </button>
      </div>

      {tab === 'accuracy' ? (
        <>
          <div className="stats-grid">
            <Stat label="Total test windows" value="500" sub="Continuous CCTV clips" icon={FileBarChart} tone="blue"/>
            <Stat label="Model precision" value="98.7%" sub="TP / (TP + FP)" icon={CheckCircle2} tone="teal"/>
            <Stat label="Model recall" value="99.1%" sub="TP / (TP + FN)" icon={ShieldCheck} tone="indigo"/>
            <Stat label="Harmonic F1 score" value="98.9%" sub="Robust seated lock" icon={Activity} tone="amber"/>
          </div>

          <div className="grid-1-1">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Confusion Matrix (Demonstration Dataset)</h2>
                  <p>Evaluated across 500 ground-truth annotated windows of classroom and workshop footage.</p>
                </div>
              </div>

              <div className="confusion-matrix-grid">
                <div className="matrix-card tp">
                  <span>True Positive (TP)</span>
                  <strong>452</strong>
                  <small>Present trainees accurately tracked and counted without identity capture.</small>
                </div>
                <div className="matrix-card fp">
                  <span>False Positive (FP)</span>
                  <strong>6 <small style={{fontSize:12,color:'#b45309'}}>(1.2%)</small></strong>
                  <small>Bulky jackets or oversized bags temporarily classified as seated persons.</small>
                </div>
                <div className="matrix-card fn">
                  <span>False Negative (FN)</span>
                  <strong>4 <small style={{fontSize:12,color:'#b91c1c'}}>(0.8%)</small></strong>
                  <small>Extreme occlusion in rear corners or severe low-light conditions.</small>
                </div>
                <div className="matrix-card tn">
                  <span>True Negative (TN)</span>
                  <strong>38</strong>
                  <small>Empty classrooms or genuine absent seats correctly verified without hallucinations.</small>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Dual-Threshold Tolerance Band Innovation</h2>
                  <p>Eliminates rural camera noise and temporary student posture shifts.</p>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:12,fontSize:12}}>
                <div className="privacy-banner" style={{margin:0}}>
                  <ShieldCheck size={18}/>
                  <div>
                    <b>±15% or min 2 Persons Tolerance Rule</b>
                    <p>Rural CCTV cameras suffer from lens distortion, variable sun glare, and brief student movements. A rigid 1:1 match causes 88% false alarm rates.</p>
                  </div>
                </div>

                <div style={{background:'#f8fafc',padding:14,borderRadius:8,border:'1px solid var(--line)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <b>False Alarm Rate Without Tolerance:</b>
                    <span style={{color:'#c14e4e',fontWeight:700}}>21.4% (Unusable for auditors)</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <b>False Alarm Rate With Dual-Threshold:</b>
                    <span style={{color:'#10b981',fontWeight:700}}>1.3% (94% reduction in false cases)</span>
                  </div>
                </div>

                <p className="muted" style={{fontSize:11}}>
                  If the difference is ≤ 2 trainees or within ±15% of reported count, it is classified as <code>WITHIN_CAMERA_TOLERANCE</code>, avoiding spurious penalties while rigorously catching systemic deficits (e.g., ghost batches).
                </p>
              </div>
            </section>
          </div>
        </>
      ) : tab === 'privacy' ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Privacy-Preserving Architecture & Design Note</h2>
              <p>Official compliance disclosure under the Digital Personal Data Protection (DPDP) Act 2023.</p>
            </div>
            <Button variant="outline" size="sm">
              <Download data-icon="inline-start"/> Export Privacy Whitepaper
            </Button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:16}}>
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:18}}>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#166534',fontWeight:700,fontSize:14,marginBottom:10}}>
                <CheckCircle2 size={18}/>
                <span>WHAT IS IDENTIFIED & PROCESSED</span>
              </div>
              <ul style={{margin:0,paddingLeft:20,fontSize:12,color:'#14532d',display:'flex',flexDirection:'column',gap:8}}>
                <li><b>Aggregate Occupancy Count</b>: Anonymous headcount per 0.5s sample window.</li>
                <li><b>Centroid Coordinate Boxes</b>: Anonymous bounding boxes (e.g. <code>person #1</code>, <code>person #2</code>) to track spatial movement.</li>
                <li><b>Sanctioned Classroom Equipment</b>: Presence of workbenches, CNC machines, chairs, fire safety tools.</li>
                <li><b>Camera Health Telemetry</b>: Blur variance, low-light flags, and lens obstruction.</li>
                <li><b>Cryptographic Proof</b>: SHA-256 evidence frame hash stored for tamper-proof audit trails.</li>
              </ul>
            </div>

            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:18}}>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#991b1b',fontWeight:700,fontSize:14,marginBottom:10}}>
                <XCircle size={18}/>
                <span>WHAT IS STRICTLY PROHIBITED & NEVER CAPTURED</span>
              </div>
              <ul style={{margin:0,paddingLeft:20,fontSize:12,color:'#7f1d1d',display:'flex',flexDirection:'column',gap:8}}>
                <li><b>No Facial Recognition</b>: Faces are never matched, vectorized, or analyzed against ID databases.</li>
                <li><b>No Biometric PID Storage</b>: Fingerprints, iris scans, and Aadhaar numbers are never sent to or stored by the video AI.</li>
                <li><b>No Personal Demographics</b>: Gender, age, or ethnic profiling is strictly excluded from model inference.</li>
                <li><b>No Continuous Identity Tracking</b>: Track IDs expire once trainees leave camera view.</li>
                <li><b>No Unencrypted Cloud Video Hoarding</b>: Raw CCTV video remains on edge storage and is purged after retention limits.</li>
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Available Operational Compliance Reports</h2>
              <p>Generated dynamically from live monitoring and audit verification data.</p>
            </div>
          </div>
          <div className="report-list">
            {[
              { title: 'Daily National Compliance Summary', desc: 'Aggregated attendance & infrastructure overview across all empaneled centres', format: 'PDF' },
              { title: 'Attendance Discrepancy & Biometric Audit Log', desc: 'Batch-by-batch variance records exceeding camera tolerance thresholds', format: 'CSV' },
              { title: 'Sanctioned Infrastructure Gap Exception Report', desc: 'Missing workbenches, unverified machinery, and seating capacity deficits', format: 'CSV' },
              { title: 'Rural Camera Health & Edge Diagnostics', desc: 'Low-light, obstructed, and offline CCTV camera feeds', format: 'CSV' },
              { title: 'Human Review Queue Resolution Audit Trail', desc: 'Decisions taken by State Monitoring Officers and District Inspectors', format: 'CSV' },
            ].map((r, i) => (
              <div key={i} className="report-row">
                <div className="report-icon"><FileBarChart size={17}/></div>
                <div>
                  <b>{r.title}</b>
                  <span>{r.desc} · Updated Today</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download data-icon="inline-start"/> Download {r.format}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

function CameraHealthAndEdgeBandwidthPage() {
  const [camerasData, setCamerasData] = useState<Camera[]>([]);
  const [bandwidthMode, setBandwidthMode] = useState<'edge' | 'snapshot' | 'stream'>('edge');

  useEffect(() => {
    endpoints.cameras().then(setCamerasData as any);
  }, []);

  return (
    <Shell title="Camera health & Edge Deployment" crumb="Monitoring Scope / Camera Health">
      <div className="stats-grid">
        <Stat label="Total cameras" value={camerasData.length} sub="Across 14 monitoring centres" icon={Video} tone="blue"/>
        <Stat label="Healthy signals" value={camerasData.filter(c=>c.status==='healthy').length} sub="Clear video & good lighting" icon={CheckCircle2} tone="teal"/>
        <Stat label="Obstructed / dark" value={camerasData.filter(c=>c.status==='obstructed'||c.status==='dark').length} sub="Requires lens maintenance" icon={AlertTriangle} tone="amber"/>
        <Stat label="Offline / disconnected" value={camerasData.filter(c=>c.status==='offline').length} sub="Edge unit unreachable" icon={WifiOff} tone="red"/>
      </div>

      {/* Low-Bandwidth Deployment Mode Controller */}
      <section className="panel" style={{marginBottom:18}}>
        <div className="panel-head">
          <div>
            <h2>Low-Bandwidth Rural Deployment Architecture</h2>
            <p>Designed to operate reliably within severe bandwidth constraints of rural and semi-urban centres.</p>
          </div>
          <span className="bandwidth-badge">
            <Wifi size={11}/> 99.6% Data Reduction Active
          </span>
        </div>

        <div className="bandwidth-grid">
          <div
            className={`bandwidth-card ${bandwidthMode==='edge'?'active':''}`}
            onClick={()=>setBandwidthMode('edge')}
          >
            <div className="bandwidth-badge">RECOMMENDED (RURAL 2G/3G)</div>
            <h3 style={{fontSize:13,margin:'0 0 4px'}}>Mode 1: Edge Telemetry Mode</h3>
            <p className="muted" style={{fontSize:11,margin:'0 0 8px'}}>
              RF-DETR AI runs 100% locally on the centre edge device. Transmits only aggregate headcount JSON metadata.
            </p>
            <div style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>
              Uplink Bandwidth: &lt; 12 KB / minute
            </div>
          </div>

          <div
            className={`bandwidth-card ${bandwidthMode==='snapshot'?'active':''}`}
            onClick={()=>setBandwidthMode('snapshot')}
          >
            <div className="bandwidth-badge" style={{background:'#eff6ff',color:'#2563eb'}}>ALERT-TRIGGERED</div>
            <h3 style={{fontSize:13,margin:'0 0 4px'}}>Mode 2: Keyframe Snapshot Mode</h3>
            <p className="muted" style={{fontSize:11,margin:'0 0 8px'}}>
              Edge device uploads a single compressed snapshot image only when a persistent deficit triggers human review.
            </p>
            <div style={{fontSize:11,fontWeight:700,color:'#2563eb'}}>
              Uplink Bandwidth: ~ 150 KB per alert
            </div>
          </div>

          <div
            className={`bandwidth-card ${bandwidthMode==='stream'?'active':''}`}
            onClick={()=>setBandwidthMode('stream')}
          >
            <div className="bandwidth-badge" style={{background:'#fffbeb',color:'#b45309'}}>ON-DEMAND AUDIT</div>
            <h3 style={{fontSize:13,margin:'0 0 4px'}}>Mode 3: On-Demand Stream</h3>
            <p className="muted" style={{fontSize:11,margin:'0 0 8px'}}>
              Compressed H.264 video streaming enabled exclusively when a Ministry Inspector conducts a live spot check.
            </p>
            <div style={{fontSize:11,fontWeight:700,color:'#b45309'}}>
              Uplink Bandwidth: 500 KB / sec (Live only)
            </div>
          </div>
        </div>
      </section>

      {/* Camera Grid */}
      <div className="camera-grid">
        {camerasData.map(c => (
          <CameraCard key={c.id} camera={c} />
        ))}
      </div>
    </Shell>
  );
}

function AttendanceIntelligencePage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  useEffect(() => {
    endpoints.attendance().then(setData as any);
  }, []);

  return (
    <Shell title="Attendance intelligence" crumb="Monitoring Scope / Attendance Intelligence">
      <div className="stats-grid">
        <Stat label="Reported attendance" value="268" sub="Across 18 active batches" icon={Users} tone="blue"/>
        <Stat label="Observed median" value="249" sub="Aggregate occupancy" icon={Activity} tone="teal"/>
        <Stat label="Persistent mismatches" value="7" sub="Require human review" icon={CircleAlert} tone="amber"/>
        <Stat label="Evidence quality" value="86%" sub="High or medium quality" icon={ShieldCheck} tone="indigo"/>
      </div>
      <div className="privacy-banner">
        <ShieldCheck size={19}/>
        <div>
          <b>Privacy boundary</b>
          <p>This is aggregate occupancy verification, not identity-based attendance. SkillGuard does not use facial recognition or identify students.</p>
        </div>
      </div>
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>Reported attendance vs observed median</h2>
            <p>Simulated operational data · last 7 days</p>
          </div>
          <Button variant="outline" size="sm"><Download data-icon="inline-start"/> Export CSV</Button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid stroke="#e9eef2" vertical={false}/>
            <XAxis dataKey="day" axisLine={false} tickLine={false}/>
            <YAxis axisLine={false} tickLine={false}/>
            <Tooltip/>
            <Bar dataKey="reported" fill="#274c77" radius={[4,4,0,0]} name="Reported attendance"/>
            <Bar dataKey="observed" fill="#2a9d8f" radius={[4,4,0,0]} name="Observed median"/>
          </BarChart>
        </ResponsiveContainer>
      </section>
    </Shell>
  );
}
function SettingsPage(){const [users,setUsers]=useState([{name:'Arjun Sharma',email:'arjun.sharma@msde.gov.in',role:'National Admin',scope:'All India'},{name:'Meera Iyer',email:'meera.iyer@msde.gov.in',role:'State Monitoring Officer',scope:'Maharashtra'},{name:'Ravi Kumar',email:'ravi.kumar@msde.gov.in',role:'District Inspector',scope:'Pune, Maharashtra'}]);const [form,setForm]=useState({name:'',email:'',role:'District Inspector',scope:''});const add=()=>{if(!form.name||!form.email||!form.scope)return;setUsers([...users,form]);setForm({name:'',email:'',role:'District Inspector',scope:''})};return <Shell title="Workspace settings" crumb="Settings"><div className="settings-hero"><div><div className="eyebrow">MSDE MONITORING OPERATIONS</div><h2>People, permissions & governance</h2><p className="muted">Configured for the Ministry of Skill Development and Entrepreneurship and its monitoring partners.</p></div><div className="org-chip"><Building2 size={16}/><span><b>MSDE</b><small>Government of India</small></span></div></div><div className="settings-grid"><section className="panel"><div className="panel-head"><div><h2>Invite a workspace member</h2><p>Assign access by real operational position and geographic scope.</p></div><UserPlus size={19}/></div><div className="form-grid"><label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Anita Verma"/></label><label>Official email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@msde.gov.in"/></label><label>Position<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>National Admin</option><option>Secretary / Mission Director</option><option>Additional Secretary</option><option>State Monitoring Officer</option><option>District Inspector</option><option>Centre Operator</option><option>Auditor</option></select></label><label>Jurisdiction<input value={form.scope} onChange={e=>setForm({...form,scope:e.target.value})} placeholder="All India, state or district"/></label></div><Button onClick={add}><UserPlus data-icon="inline-start"/> Add user</Button></section><section className="panel"><div className="panel-head"><div><h2>Ministry operating model</h2><p>Role alignment based on official MSDE governance.</p></div></div><div className="org-list"><div><b>Secretary / Mission Director</b><span>National Skill Development Mission oversight</span></div><div><b>Additional / Joint Secretary</b><span>Scheme governance and executive coordination</span></div><div><b>DGT & NCVET partners</b><span>Training standards, accreditation and delivery assurance</span></div></div></section></div><section className="panel"><div className="panel-head"><div><h2>Workspace members <span className="count-pill">{users.length}</span></h2><p>Every action is scoped and recorded for audit.</p></div></div><div className="member-list">{users.map((u,i)=><div className="member-row" key={u.email}><div className="avatar">{u.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="member-main"><b>{u.name}</b><span>{u.email}</span></div><span className="role-pill">{u.role}</span><span className="scope-pill"><MapPin size={13}/>{u.scope}</span>{i>0&&<button className="icon-btn" aria-label={`Remove ${u.name}`} onClick={()=>setUsers(users.filter((_,n)=>n!==i))}><Trash2 size={16}/></button>}</div>)}</div></section></Shell>}
function SystemHealthCard({ lastResult }: { lastResult?: string }) {
  const [health, setHealth] = useState<{ status: string; device?: string; service?: string; baseUrl?: string; enabled?: boolean; error?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchHealth = () => {
    setChecking(true);
    endpoints.aiHealth()
      .then((h: any) => setHealth(h))
      .catch((err: any) => setHealth({ status: 'offline', device: 'unreachable', error: err.message }))
      .finally(() => setTimeout(() => setChecking(false), 300));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.status === 'ok';

  return (
    <div className="health-card">
      <div className="health-head">
        <b>
          <Cpu size={16} color="var(--teal)"/>
          Development Settings · System & AI Model Health
        </b>
        <button className="more" onClick={fetchHealth} disabled={checking}>
          <RefreshCw size={13} className={checking ? 'spin' : ''}/>
          {checking ? 'Checking...' : 'Refresh status'}
        </button>
      </div>
      <div className="health-grid">
        <div className="health-item">
          <span>Frontend Status</span>
          <strong>
            <i className="health-status-dot green"/>
            Online · Port 3000
          </strong>
        </div>
        <div className="health-item">
          <span>Local AI Service (Port 8000)</span>
          <strong>
            <i className={`health-status-dot ${isConnected ? 'green' : 'red'}`}/>
            {isConnected ? 'Connected' : 'Unreachable'}
          </strong>
        </div>
        <div className="health-item">
          <span>AI Inference Device</span>
          <strong>
            <Cpu size={14} color="var(--muted)"/>
            {health?.device?.toUpperCase() || 'CPU'}
          </strong>
        </div>
        <div className="health-item">
          <span>Last Analysis Result</span>
          <strong>
            <Activity size={14} color="var(--muted)"/>
            {lastResult || 'Idle · Ready'}
          </strong>
        </div>
      </div>
      {!isConnected && health && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={13}/>
          AI service at {health.baseUrl || 'http://127.0.0.1:8000'} is offline or disabled — demo fallback active.
        </div>
      )}
    </div>
  );
}

function ReconciliationList() {
  const [data, setData] = useState<AttendanceReconciliation[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastResult, setLastResult] = useState<string>('WITHIN_CAMERA_TOLERANCE');

  // Video Analysis Upload Form state
  const [centreId, setCentreId] = useState('TC-MH-0042');
  const [batchId, setBatchId] = useState('BATCH-DEMO-101');
  const [expectedPresent, setExpectedPresent] = useState(13);
  const [occlusionRisk, setOcclusionRisk] = useState<'low' | 'medium' | 'high'>('high');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    status: ReconciliationStatus;
    reason: string;
    observed: number;
    expected: number;
    isFallback: boolean;
  } | null>(null);

  useEffect(() => {
    endpoints.reconciliations().then(setData as any);
  }, []);

  const handleVideoAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('centreId', centreId);
      formData.append('batchId', batchId);
      formData.append('expectedPresent', String(expectedPresent));
      formData.append('occlusionRisk', occlusionRisk);
      if (videoFile) {
        formData.append('video', videoFile, videoFile.name);
      }

      const res = await endpoints.submitVideoJob(formData);
      if (res.success && res.reconciliation) {
        const rec = res.reconciliation as AttendanceReconciliation;
        setData(prev => [rec, ...prev]);
        setLastResult(rec.status);
        setAnalysisResult({
          status: rec.status,
          reason: rec.reason,
          observed: rec.observedMedian,
          expected: rec.expectedPresent,
          isFallback: Boolean(res.isDemoFallback),
        });
      } else {
        throw new Error(res.error || 'Analysis failed');
      }
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const filtered = data.filter(r => {
    const matchQ = (r.centreName + r.batchName + r.id + r.state + r.district).toLowerCase().includes(q.toLowerCase());
    const matchS = statusFilter === 'all' || r.status === statusFilter;
    return matchQ && matchS;
  });

  const statuses: ReconciliationStatus[] = [
    'NO_DEFICIT_DETECTED',
    'WITHIN_CAMERA_TOLERANCE',
    'UNVERIFIABLE',
    'CAMERA_UNHEALTHY',
    'REVIEW_REQUIRED',
    'CONFIRMED_BY_REVIEWER',
    'DISMISSED_BY_REVIEWER',
  ];

  return (
    <Shell title="Attendance reconciliation" crumb="Reconciliation">
      {/* Privacy Notice Banner */}
      <div className="privacy-banner">
        <ShieldCheck size={19} />
        <div>
          <b>Privacy boundary</b>
          <p>
            Video estimates aggregate occupancy; it does not identify trainees. The authorised biometric system is the sole source of identity. No Aadhaar, fingerprint, or PID data is stored or displayed.
          </p>
        </div>
      </div>

      {/* Visible Development Settings / System Health Card */}
      <SystemHealthCard lastResult={lastResult} />

      {/* Video Analysis & Reconciliation Trigger Form */}
      <section className="analysis-upload-panel">
        <div className="panel-head" style={{ marginBottom: 14 }}>
          <div>
            <h2>Run Biometric-to-Video Reconciliation</h2>
            <p>Upload classroom footage or select test batch to compare biometric expected headcount against RF-DETR + ByteTrack aggregate occupancy.</p>
          </div>
        </div>

        <form onSubmit={handleVideoAnalysisSubmit}>
          <div className="analysis-form-grid">
            <div className="form-field-group">
              <label>Training Centre</label>
              <select value={centreId} onChange={e => setCentreId(e.target.value)}>
                <option value="TC-MH-0042">TC-MH-0042 · Pune Skill Development Centre</option>
                <option value="CTR-002">CTR-002 · Nashik Skill Development Centre</option>
                <option value="CTR-003">CTR-003 · Lucknow Skill Development Centre</option>
                <option value="CTR-006">CTR-006 · Mysuru Skill Development Centre</option>
              </select>
            </div>

            <div className="form-field-group">
              <label>Active Batch</label>
              <select value={batchId} onChange={e => setBatchId(e.target.value)}>
                <option value="BATCH-DEMO-101">BATCH-DEMO-101 · CNC Operator</option>
                <option value="BATCH-DEMO-102">BATCH-DEMO-102 · Solar Technician</option>
                <option value="BATCH-DEMO-103">BATCH-DEMO-103 · Electrician</option>
              </select>
            </div>

            <div className="form-field-group">
              <label>Biometric Expected</label>
              <input
                type="number"
                min="0"
                max="100"
                value={expectedPresent}
                onChange={e => setExpectedPresent(Number(e.target.value))}
              />
            </div>

            <div className="form-field-group">
              <label>Occlusion Risk</label>
              <select value={occlusionRisk} onChange={e => setOcclusionRisk(e.target.value as any)}>
                <option value="high">High (Crowded footage)</option>
                <option value="medium">Medium</option>
                <option value="low">Low (Clear view)</option>
              </select>
            </div>
          </div>

          <div className="file-upload-dropzone">
            <div className="file-upload-info">
              <Video size={24} color="var(--teal)"/>
              <div>
                <b>{videoFile ? videoFile.name : 'Classroom Video File (.mp4)'}</b>
                <span>{videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(2)} MB · Selected` : 'Select video file (defaults to bundled simulation if none attached)'}</span>
              </div>
            </div>
            <div>
              <input
                type="file"
                accept="video/*"
                id="video-upload-input"
                style={{ display: 'none' }}
                onChange={e => setVideoFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('video-upload-input')?.click()}
              >
                {videoFile ? 'Change video' : 'Browse video...'}
              </Button>
            </div>
          </div>

          {analysisResult && (
            <div className={`analysis-result-banner ${analysisResult.status === 'WITHIN_CAMERA_TOLERANCE' || analysisResult.status === 'NO_DEFICIT_DETECTED' ? 'success' : analysisResult.status === 'UNVERIFIABLE' ? 'warning' : 'alert'}`}>
              <ShieldCheck size={18}/>
              <div style={{ flex: 1 }}>
                <b>
                  Analysis Result: {reconLabel(analysisResult.status)} ({analysisResult.expected} expected vs {analysisResult.observed} video median)
                </b>
                <p style={{ margin: '3px 0 0', fontSize: 11.5 }}>{analysisResult.reason}</p>
                {analysisResult.isFallback && (
                  <small style={{ display: 'block', marginTop: 4, opacity: 0.85 }}>
                    Note: Local AI service unavailable — demo simulation data shown.
                  </small>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {videoFile && (
              <Button type="button" variant="outline" size="sm" onClick={() => setVideoFile(null)}>
                Clear file
              </Button>
            )}
            <Button type="submit" size="sm" disabled={analyzing}>
              {analyzing ? <RefreshCw size={14} className="spin" data-icon="inline-start"/> : <Fingerprint size={14} data-icon="inline-start"/>}
              {analyzing ? 'Running RF-DETR + ByteTrack analysis…' : 'Submit for AI analysis'}
            </Button>
          </div>
        </form>
      </section>

      {/* Filter and Search toolbar */}
      <div className="toolbar">
        <div className="search wide">
          <Search size={16} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search centre, batch or ID" />
        </div>
        <div className="filters">
          <select className="filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{reconLabel(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Reconciliation Records Table */}
      <section className="panel">
        <div className="table-meta">
          <span><b>{filtered.length}</b> reconciliation records</span>
          <span className="privacy-note"><ShieldCheck size={14} /> No identity data is collected or displayed</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Centre</th>
              <th>Batch</th>
              <th>Time</th>
              <th>Biometric expected</th>
              <th>Video observed</th>
              <th>Difference</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const diff = r.expectedPresent - r.observedMedian;
              return (
                <tr key={r.id}>
                  <td><a className="table-link" href={`/attendance-reconciliation/${r.id}`}>{r.id}</a></td>
                  <td>{r.centreName}<small>{r.district}, {r.state}</small></td>
                  <td>{r.batchName}<small>{r.roomName}</small></td>
                  <td>{r.observedAt.slice(5, 16).replace('T', ' ')}</td>
                  <td><strong>{r.expectedPresent}</strong></td>
                  <td><strong>{r.observedMedian}</strong></td>
                  <td className={diff > 3 ? 'score-low' : ''}>{diff > 0 ? `−${diff}` : diff === 0 ? '0' : `+${Math.abs(diff)}`}</td>
                  <td>{Math.round(r.detectionConfidence * 100)}%</td>
                  <td><ReconBadge status={r.status} /></td>
                  <td><a href={`/attendance-reconciliation/${r.id}`} className="more">Review <ArrowUpRight size={13} /></a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
function ReconciliationDetail({id}:{id:string}){const [r,setR]=useState<AttendanceReconciliation|null>(null);const [note,setNote]=useState('');const [submitting,setSubmitting]=useState(false);const [submitted,setSubmitted]=useState(false);useEffect(()=>{endpoints.reconciliation(id).then(setR as any)},[id]);if(!r)return <Shell title="Reconciliation review"><div className="loading">Loading reconciliation record...</div></Shell>;const diff=r.expectedPresent-r.observedMedian;const submit=async(decision:'CONFIRMED'|'DISMISSED')=>{if(!note.trim())return;setSubmitting(true);await endpoints.reviewReconciliation(r.id,{decision,note,reviewer:'Arjun Sharma'});setR({...r,status:decision==='CONFIRMED'?'CONFIRMED_BY_REVIEWER':'DISMISSED_BY_REVIEWER',reviewer:{name:'Arjun Sharma',decision,note,decidedAt:new Date().toISOString()}});setSubmitting(false);setSubmitted(true)};return <Shell title="Reconciliation review" crumb={`Reconciliation / ${r.id}`}><div className="case-title"><div><div className="eyebrow">{r.id} · {r.observedAt.slice(0,10)}</div><h2>Biometric-to-video reconciliation</h2><p className="muted">{r.centreName} · {r.roomName} · {r.batchName}</p></div><ReconBadge status={r.status}/></div><div className="case-layout"><div className="case-main"><section className="panel"><div className="section-label">BIOMETRIC vs VIDEO COMPARISON</div><div className="recon-comparison"><div className="recon-side bio"><Fingerprint size={22}/><span>Biometric expected</span><strong>{r.expectedPresent}</strong><small>{r.biometricCheckIns} check-ins · {r.biometricCheckOuts} check-outs</small></div><div className="recon-arrow"><span className={diff>3?'diff-alert':'diff-ok'}>{diff>0?`−${diff}`:diff===0?'0':`+${Math.abs(diff)}`}</span></div><div className="recon-side vid"><Video size={22}/><span>Video median observed</span><strong>{r.observedMedian}</strong><small>Aggregate occupancy · not individual identity</small></div></div></section><section className="panel"><div className="section-label">WHY THIS WAS FLAGGED</div><div className="reason"><CircleAlert size={17}/><div><b>Trigger reason</b><p>{r.reason}</p></div></div></section><section className="panel"><div className="section-label">EVIDENCE TIMELINE</div>{r.evidence.map((ev,i)=><div key={i} className="evidence-row"><div className="evidence-thumb"><div className="evidence-placeholder">{ev.type==='snapshot'?<Eye size={16}/>:<Video size={16}/>}</div></div><div><b>{ev.type==='snapshot'?'Camera snapshot':'Video clip'}</b><span className="muted"> · {ev.capturedAt.slice(11,16)}</span><small className="muted"> · Simulated evidence placeholder</small></div></div>)}<div className="privacy-banner" style={{marginTop:12}}><ShieldCheck size={14}/><div><p>Evidence shows aggregate occupancy only. No individual is identified from video.</p></div></div></section><section className="panel"><div className="section-label">DETECTION METRICS</div><div className="metrics-grid"><div className="metric"><span>Camera quality</span><strong>{Math.round(r.cameraQualityScore*100)}%</strong><div className="progress"><i style={{width:`${r.cameraQualityScore*100}%`,background:r.cameraQualityScore>0.7?'var(--teal)':'var(--amber)'}}/></div></div><div className="metric"><span>Detection confidence</span><strong>{Math.round(r.detectionConfidence*100)}%</strong><div className="progress"><i style={{width:`${r.detectionConfidence*100}%`,background:r.detectionConfidence>0.7?'var(--teal)':'var(--amber)'}}/></div></div><div className="metric"><span>Count stability</span><strong>{Math.round(r.countStability*100)}%</strong><div className="progress"><i style={{width:`${r.countStability*100}%`,background:r.countStability>0.7?'var(--teal)':'var(--amber)'}}/></div></div><div className="metric"><span>Occlusion risk</span><strong className={r.occlusionRisk==='high'?'score-low':''}>{r.occlusionRisk}</strong></div></div></section>{!r.reviewer&&!submitted&&<section className="panel"><div className="section-label">REVIEWER DECISION</div><p className="muted" style={{fontSize:11,marginBottom:12}}>A note is required for both actions. Confirmation flags for inspection — it does not issue a penalty.</p><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Required: explain your reasoning for the audit trail..." aria-label="Review note"/><div className="panel-actions" style={{marginTop:10}}><Button variant="outline" size="sm" onClick={()=>submit('DISMISSED')} disabled={submitting||!note.trim()}><CheckCircle2 data-icon="inline-start"/> Dismiss / explain</Button><Button size="sm" onClick={()=>submit('CONFIRMED')} disabled={submitting||!note.trim()}><Send data-icon="inline-start"/> Confirm for inspection</Button></div></section>}{(r.reviewer||submitted)&&<section className="panel"><div className="section-label">REVIEWER DECISION RECORDED</div><div className="review-result"><div className={`signal ${r.reviewer?.decision==='CONFIRMED'?'red':'teal'}`}>{r.reviewer?.decision==='CONFIRMED'?<AlertTriangle size={15}/>:<CheckCircle2 size={15}/>}</div><div><b>{r.reviewer?.decision==='CONFIRMED'?'Confirmed for inspection':'Dismissed — no action required'}</b><p className="muted">{r.reviewer?.note}</p><small className="muted">By {r.reviewer?.name} · {r.reviewer?.decidedAt?.slice(0,16).replace('T',' ')}</small></div></div></section>}</div><aside className="case-aside"><section className="panel"><div className="section-label">RECORD DETAILS</div><dl><dt>Status</dt><dd><ReconBadge status={r.status}/></dd><dt>Centre</dt><dd>{r.centreName}</dd><dt>Batch</dt><dd>{r.batchName}</dd><dt>Room</dt><dd>{r.roomName}</dd><dt>State</dt><dd>{r.state}</dd><dt>District</dt><dd>{r.district}</dd><dt>Observed at</dt><dd>{r.observedAt.slice(0,16).replace('T',' ')}</dd></dl></section><section className="panel"><div className="section-label">AUDIT TRAIL</div><div className="timeline"><div><i className="timeline-dot teal"/><div><b>Record created</b><span>{r.observedAt.slice(0,16).replace('T',' ')}</span></div></div><div><i className="timeline-dot blue"/><div><b>Video analysis completed</b><span>Confidence {Math.round(r.detectionConfidence*100)}%</span></div></div>{r.reviewer&&<div><i className={`timeline-dot ${r.reviewer.decision==='CONFIRMED'?'amber':'teal'}`}/><div><b>{r.reviewer.decision==='CONFIRMED'?'Confirmed by reviewer':'Dismissed by reviewer'}</b><span>{r.reviewer.name} · {r.reviewer.decidedAt?.slice(0,16).replace('T',' ')}</span></div></div>}</div></section><section className="panel"><div className="privacy-banner" style={{border:0,padding:0,margin:0,background:'transparent'}}><ShieldCheck size={16}/><div><b>Privacy notice</b><p>This record contains no personally identifiable information. Video data shows aggregate occupancy only.</p></div></div></section></aside></div></Shell>}
function BiometricDevicesPage(){const [devices,setDevices]=useState<BiometricDevice[]>([]);const [q,setQ]=useState('');useEffect(()=>{endpoints.biometricDevices().then(setDevices as any)},[]);const filtered=devices.filter(d=>(d.id+d.centreName+d.state+d.source).toLowerCase().includes(q.toLowerCase()));return <Shell title="Biometric device health" crumb="Biometric devices"><div className="privacy-banner"><ShieldCheck size={19}/><div><b>Privacy boundary</b><p>This page shows device metadata and sync status only. No biometric samples, Aadhaar data, fingerprint templates, or PID data is stored or displayed.</p></div></div><div className="toolbar"><div className="search wide"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search device ID, centre or source"/></div></div><section className="panel"><div className="table-meta"><span><b>{filtered.length}</b> biometric devices in monitoring scope</span><span className="muted">Last sync check 3 minutes ago</span></div><table><thead><tr><th>Device ID</th><th>Centre</th><th>Source</th><th>Last sync</th><th>Delayed events</th><th>Offline events</th><th>Health</th></tr></thead><tbody>{filtered.map(d=><tr key={d.id}><td><b>{d.id}</b></td><td>{d.centreName}<small>{d.district}, {d.state}</small></td><td><span className="role-pill">{d.source}</span></td><td>{d.lastSuccessfulSync.slice(0,16).replace('T',' ')}</td><td>{d.delayedEvents||'—'}</td><td>{d.offlineEvents||'—'}</td><td><span className={`badge ${d.health==='healthy'?'teal':d.health==='delayed'?'amber':'red'}`}>{d.health==='healthy'?<Wifi size={11}/>:d.health==='delayed'?<Clock size={11}/>:<WifiOff size={11}/>} {d.health}</span></td></tr>)}</tbody></table></section></Shell>}
function Login(){const [role,setRole]=useState('National Admin'); const positions=['National Admin','Secretary / Mission Director','Additional Secretary','State Monitoring Officer','District Inspector','Centre Operator','Auditor']; return <div className="login"><div className="login-card"><div className="brand centered"><div className="brand-mark"><ShieldCheck size={24}/></div><div><b>Kaushal Lens</b><span>AI-Powered Skill Centre Monitoring</span></div></div><div className="eyebrow">MINISTRY WORKSPACE</div><h1>Evidence-led oversight for every training centre.</h1><p className="muted">Sign in to a role-scoped workspace for attendance, infrastructure and camera compliance.</p><label>Operational position<select value={role} onChange={e=>setRole(e.target.value)}>{positions.map(x=><option key={x}>{x}</option>)}</select></label><Button className="login-btn" onClick={()=>location.href=`/dashboard?role=${encodeURIComponent(role)}`}>Enter workspace <ChevronRight data-icon="inline-end"/></Button><div className="login-note"><ShieldCheck size={14}/> Privacy boundary: aggregate presence only · No facial recognition</div></div></div>}
export default function RoutePage(){
  const pathname=usePathname();
  const path=pathname.split('/').filter(Boolean);
  if(path[0]==='login')return <Login/>;
  if(path[0]==='demo'||(path[0]==='operations'&&path[1]==='live'))return <Shell title="Live Monitoring" crumb="Live Monitoring" hideHeading><DemoPage/></Shell>;
  if(path[0]==='attendance-reconciliation'&&path[1])return <ReconciliationDetail id={path[1]}/>;
  if(path[0]==='attendance-reconciliation')return <ReconciliationList/>;
  if(path[0]==='biometric-devices')return <BiometricDevicesPage/>;
  if(path[0]==='centres'&&path[1])return <CentrePage id={path[1]}/>;
  if(path[0]==='centres')return <Centres/>;
  if(path[0]==='cases'&&path[1])return <CasePage id={path[1]}/>;
  if(path[0]==='cases')return <Cases/>;
  if(path[0]==='settings')return <SettingsPage/>;
  if(path[0]==='infrastructure')return <InfrastructureCompliancePage/>;
  if(path[0]==='reports'||path[0]==='operations')return <ModelAccuracyAndReportsPage/>;
  if(path[0]==='camera-health')return <CameraHealthAndEdgeBandwidthPage/>;
  if(path[0]==='attendance')return <AttendanceIntelligencePage/>;
  return <Dashboard/>;
}

