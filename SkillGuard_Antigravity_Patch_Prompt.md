# Prompt for Antigravity

Copy everything below into Antigravity while your existing **SkillGuard frontend/backend repository** is open.

---

You are patching an existing SkillGuard training-centre compliance portal. First inspect the repository structure, existing framework, API patterns, component library, authentication, and mock-data approach. Preserve its conventions and do not replace unrelated pages, styling, routes, or working features.

## Objective

Add a privacy-preserving **Biometric-to-Video Attendance Reconciliation** feature. This is for an Indian training-centre monitoring project. Existing biometric/AEBAS-style systems record check-in/check-out events; RF-DETR + ByteTrack video inference estimates only aggregate classroom occupancy. The portal compares the two signals. It must never identify people from CCTV and must never store Aadhaar number, fingerprint, iris, biometric templates, or PID data.

The source of truth for a person’s identity is the authorised biometric system. Video is only a non-identifying occupancy signal.

## Non-negotiable product rules

1. Do not build face recognition, face matching, trainee identification from video, or any UI suggesting that video proves an individual’s identity.
2. Do not label a case “fraud”, “violation”, or “non-compliant” automatically. The strongest automatic state is `REVIEW_REQUIRED`; a human reviewer makes the final decision.
3. If visual confidence, camera health, or occlusion is inadequate, use `UNVERIFIABLE` or `CAMERA_UNHEALTHY`, not a negative finding.
4. The frontend must not call a local model or cloud GPU directly in production. It calls the main authenticated backend. The backend calls the private AI inference service asynchronously.
5. All identifiers displayed in biometric tables must be masked/tokenised (for example `TRN-•••A91`).

## Implement these data contracts

```ts
type ComplianceStatus =
  | "NO_DEFICIT_DETECTED"
  | "WITHIN_CAMERA_TOLERANCE"
  | "UNVERIFIABLE"
  | "CAMERA_UNHEALTHY"
  | "REVIEW_REQUIRED"
  | "CONFIRMED_BY_REVIEWER"
  | "DISMISSED_BY_REVIEWER";

type AttendanceReconciliation = {
  id: string;
  centreId: string;
  centreName: string;
  batchId: string;
  batchName: string;
  roomName: string;
  observedAt: string;
  expectedPresent: number; // biometric check-ins minus valid check-outs
  biometricCheckIns: number;
  biometricCheckOuts: number;
  observedMedian: number; // video aggregate count
  cameraQualityScore: number; // 0–1
  detectionConfidence: number; // 0–1
  countStability: number; // 0–1
  occlusionRisk: "low" | "medium" | "high";
  status: ComplianceStatus;
  reason: string;
  evidence: { type: "snapshot" | "clip"; url: string; capturedAt: string }[];
  reviewer?: { name: string; decision: "CONFIRMED" | "DISMISSED"; note: string; decidedAt: string };
};
```

## Add frontend features

### 1. Dashboard widgets

Add a “Attendance Reconciliation” section to the existing dashboard:

- Batches verified today
- `REVIEW_REQUIRED` count
- `UNVERIFIABLE` count
- Biometric device sync health
- Chart/table comparing expected biometric attendance and observed video occupancy by batch
- Clear disclaimer: “Video estimates aggregate occupancy; it does not identify trainees.”

### 2. Reconciliation list page

Create a route consistent with the existing router, preferably `/attendance-reconciliation`.

- Filters: date, state, district/state, centre, camera quality, biometric sync state.
- Search by centre or batch ID/name.
- Status chips with accessible colour and icon treatment:
  - green: `NO_DEFICIT_DETECTED`
  - blue/neutral: `WITHIN_CAMERA_TOLERANCE`
  - amber: `UNVERIFIABLE`, `CAMERA_UNHEALTHY`
  - red: `REVIEW_REQUIRED`
- Table fields: centre, batch, time, biometric expected, video observed median, difference, confidence, state, action.
- Never show raw biometric IDs or PII.

### 3. Case-detail drawer/page

Clicking a row opens a polished detail view with:

- A side-by-side “Biometric expected: 18” and “Video median observed: 15” comparison.
- A concise explanation generated from `reason`.
- Evidence timeline with snapshots/clip thumbnails; keep a placeholder when using demo data.
- Camera health, detection confidence, count stability, and occlusion risk.
- Reviewer actions: `Confirm for inspection` and `Dismiss / explain`. Require a note for both. Confirmation does not issue a penalty.
- Full activity/audit timeline.
- Privacy notice.

### 4. Biometric device health page or tab

Show device ID, centre, source (`AEBAS`, `RFID`, `FINGERPRINT_VENDOR`, `DEMO`), last successful sync, delayed/offline event count, and health. Do not expose biometric samples or Aadhaar data.

### 5. Demo data

Add realistic mock data for at least 12 reconciliation records across multiple Indian states and centres. Include each decision state, especially:

- crowded classroom: 13 expected / 10.5 observed / `UNVERIFIABLE` / high occlusion;
- healthy match: 13 expected / 12 observed / `WITHIN_CAMERA_TOLERANCE`;
- reliable mismatch: 20 expected / 7 observed / `REVIEW_REQUIRED`;
- offline camera: `CAMERA_UNHEALTHY`;
- normal no-deficit result.

Use tokenised trainee references only in mock biometric event data.

## Backend/API work

Implement or extend the existing backend using its current language/framework. If the repository currently has only frontend mock routes, create typed mock API handlers with the following exact contracts so the UI is ready to swap to real APIs:

```text
GET  /api/v1/reconciliations?centreId=&status=&from=&to=
GET  /api/v1/reconciliations/:id
POST /api/v1/reconciliations/:id/review
GET  /api/v1/biometric-devices
POST /api/v1/biometric/events
GET  /api/v1/attendance/:centreId/:batchId
POST /api/v1/analysis/video-jobs
GET  /api/v1/analysis/video-jobs/:id
```

`POST /api/v1/analysis/video-jobs` must accept a video reference/object-storage key, not require the browser to upload large files directly to the AI service. Return `202 Accepted` and a job ID. In a production adapter, send the work to a private local/central inference service; for mock mode, create a completed job using demo output.

Keep database/schema migrations compatible with the project. Add a `biometric_events` table/model with only tokenised trainee ref, source, device ID, event type, timestamp, centre ID, batch ID, sync metadata, and audit timestamps. Do not add biometric template fields.

## Local AI service integration

There is a standalone service at:

`outputs/skillguard-local-ai`

For local development it runs at `http://127.0.0.1:8000`. It exposes:

```text
GET  /health
POST /v1/attendance/events
GET  /v1/attendance/{centre_id}/{batch_id}
POST /v1/analysis/video
POST /v1/reconciliation
```

Create backend environment variables:

```env
SKILLGUARD_AI_BASE_URL=http://127.0.0.1:8000
SKILLGUARD_AI_ENABLED=false
```

When `SKILLGUARD_AI_ENABLED=false`, use mock data and do not make network requests. When true, the server-side backend—not browser—calls the service. Add a small typed AI client module, timeouts, clear error handling, and a feature flag fallback.

## Quality bar

- Match the existing app design system, dark/light mode, responsive behaviour, loading, empty, error, and skeleton states.
- Use accessible labels, keyboard-friendly filters/dialogs, semantic HTML, and readable number/date formatting.
- Add unit tests for status mapping and reconciliation API mock handlers if the repo already has a test setup.
- Add a short README section explaining the feature, local setup, demo mode, data boundaries, and that reviewer approval is required.
- Run lint, typecheck, and existing tests. Fix all issues you introduce.

At the end, report: files changed, routes added, environment variables, how to start the local AI service, how to test the full demo flow, and any project-specific assumptions you made.
