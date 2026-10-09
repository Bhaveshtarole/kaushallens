# SkillGuard Command Centre

A production-style monitoring and compliance oversight portal for Indian vocational training centres under the Ministry of Skill Development and Entrepreneurship (MSDE).

The portal combines aggregate CCTV occupancy observations with authorised biometric attendance (AEBAS/RFID), sanctioned infrastructure verification, batch schedules, and edge camera health diagnostics.

---

## Key Principles & Privacy Boundaries

1. **No Facial Recognition**: The platform never performs face recognition, face matching, or individual trainee identification from video feeds.
2. **Biometrics as Identity Source of Truth**: Trainee identity is recorded solely through authorised biometric devices (e.g., AEBAS / UIDAI-compliant devices). Video provides only a non-identifying aggregate headcount.
3. **Strict PII Protection**: No Aadhaar numbers, fingerprint templates, iris scans, or PID blocks are ever stored, processed, or displayed. Biometric event telemetry contains only masked, tokenised references (e.g. `TRN-•••A91`).
4. **Human-in-the-Loop Governance**: Systems never automatically label discrepancies as "fraud" or "violations". The highest automated finding is `REVIEW_REQUIRED`. A human reviewer must verify the evidence and provide an audit note.
5. **Safe Degradation on Low Signal**: Inadequate visual confidence, high occlusion, or offline cameras result in `UNVERIFIABLE` or `CAMERA_UNHEALTHY` statuses—never a penalty or deficit finding.

---

## Biometric-to-Video Attendance Reconciliation

### Compliance States
- `NO_DEFICIT_DETECTED`: Video aggregate occupancy aligns with biometric check-in counts.
- `WITHIN_CAMERA_TOLERANCE`: Observed difference falls within the ±15% room camera tolerance margin.
- `UNVERIFIABLE`: High occlusion or low lighting prevents a reliable aggregate count.
- `CAMERA_UNHEALTHY`: Camera offline, blurred, or frozen stream.
- `REVIEW_REQUIRED`: Reliable, high-confidence occupancy count is significantly below biometric expected count. Requires human officer review.
- `CONFIRMED_BY_REVIEWER`: Officer confirmed the case after inspection (requires reason note; does not automatically penalise).
- `DISMISSED_BY_REVIEWER`: Officer dismissed the discrepancy (e.g., trainees were in an adjacent practical workshop).

---

## Local AI Service Integration

A private standalone AI inference service is located at:
```
outputs/skillguard-local-ai
```

The service runs locally at `http://127.0.0.1:8000` and exposes:
- `GET  /health` — Health check
- `POST /v1/attendance/events` — Ingest biometric events
- `GET  /v1/attendance/{centre_id}/{batch_id}` — Query batch attendance
- `POST /v1/analysis/video` — Asynchronous video occupancy estimation
- `POST /v1/reconciliation` — Signal comparison and compliance classification

### Environment Variables

Configure these in `.env.local`:
```env
SKILLGUARD_AI_BASE_URL=http://127.0.0.1:8000
SKILLGUARD_AI_ENABLED=false
```

- When `SKILLGUARD_AI_ENABLED=false` (default demo mode), the portal uses rich local mock data and makes no external network calls.
- When `SKILLGUARD_AI_ENABLED=true`, the Next.js server-side route handlers call the local AI service asynchronously with timeout and fallback protection. The frontend client never calls the AI service directly.

---

## Local Setup & Development

```bash
# Install dependencies
pnpm install
# or
npm install

# Start the Next.js dev server
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application Navigation & Routes

| Route | Description |
|---|---|
| `/dashboard` | Command centre overview with reconciliation summary widgets & batch comparison chart |
| `/attendance-reconciliation` | Full reconciliation log with filters, search, status chips, and difference metrics |
| `/attendance-reconciliation/:id` | Case detail drawer with side-by-side comparison, metrics, evidence timeline & review actions |
| `/biometric-devices` | Biometric device health, sync telemetry, and offline event status (tokenised metadata only) |
| `/centres` | Training centre profiles, infrastructure, and camera inventory |
| `/cases` | Compliance case queue |
| `/attendance` | Aggregate attendance intelligence |
| `/camera-health` | CCTV edge camera health and stream status |
| `/settings` | Workspace access control and role assignments |

---

## API Endpoints (v1)

### Reconciliation & Biometrics
- `GET  /api/v1/reconciliations?centreId=&status=&from=&to=` — List reconciliation records with filters
- `GET  /api/v1/reconciliations/:id` — Single reconciliation detail
- `POST /api/v1/reconciliations/:id/review` — Submit reviewer decision (`CONFIRMED` or `DISMISSED` with note)
- `GET  /api/v1/biometric-devices` — Biometric device health telemetry
- `POST /api/v1/biometric/events` — Ingest biometric check-in / check-out events
- `GET  /api/v1/attendance/:centreId/:batchId` — Biometric attendance summary for a batch
- `POST /api/v1/analysis/video-jobs` — Submit video storage reference for analysis (`202 Accepted`)
- `GET  /api/v1/analysis/video-jobs/:id` — Retrieve video analysis job status

---

## Demo Flow Walkthrough

1. **Dashboard**: Navigate to `/dashboard` to observe the **Attendance Reconciliation** section with key indicators (Batches verified today, Review required, Unverifiable, Device sync health) and the biometric vs. video occupancy comparison chart.
2. **Reconciliation List**: Click **View all** or open `/attendance-reconciliation` from the sidebar. Filter by status (`REVIEW_REQUIRED`, `UNVERIFIABLE`, etc.) or search by centre name.
3. **Case Detail & Decision**: Click on a case such as `REC-3009` (a `REVIEW_REQUIRED` case) or `REC-3005` (`UNVERIFIABLE`). Review the side-by-side expected vs. observed metrics and detection confidence.
4. **Reviewer Decision**: Enter an explanation in the reviewer note box and click **Confirm for inspection** or **Dismiss / explain**. The decision is persisted in memory for your session and appended to the audit trail.
5. **Biometric Device Health**: Navigate to `/biometric-devices` to verify sync status, delayed counts, and connectivity across all training centres without exposing PII.
