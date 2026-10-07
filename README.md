# SkillGuard Command Centre

A production-style SIH demo for privacy-preserving compliance monitoring across vocational training centres. The app compares aggregate CCTV occupancy observations with reported attendance, sanctioned infrastructure, batch schedules and camera health. It never identifies people and clearly labels simulated data.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Use `/login` for the demo sign-in, or go directly to `/dashboard`.

## Demo flow

1. Open Command centre to see the national summary, trends and centre risk ranking.
2. Open Centres and select a centre. Explore Batches, Infrastructure and Cameras tabs.
3. Open Case queue and select an issue. Use the review actions; actions are persisted for the current UI session through the mock API response.
4. Review Attendance, Infrastructure, Camera health and Reports pages.

Demo roles: National Admin, State Monitoring Officer, District Inspector, Centre Operator and Auditor.

## Architecture

- Next.js App Router + TypeScript + Tailwind CSS.
- `lib/types.ts` contains domain contracts.
- `lib/mock-data.ts` contains rich, deterministic demo data for 12 centres, 30 cameras, 18 batches and 28 cases.
- `lib/api.ts` is the frontend service layer; page components do not import mock data directly.
- `app/api/[[...path]]/route.ts` provides local mock Route Handler responses with realistic development latency.
- Recharts powers analytics and Lucide provides accessible interface icons.

## API routes

GET `/api/dashboard/summary`, `/api/centres`, `/api/centres/:id`, `/api/cases`, `/api/cases/:id`, `/api/attendance`, `/api/infrastructure`, `/api/camera-health`, `/api/reports`, `/api/notifications`.

POST `/api/cases/:id/assign`, `/api/cases/:id/review`, `/api/cases/:id/escalate`, `/api/cases/:id/close`, `/api/settings/reset-demo-data`.

All values are simulated and intended for presentation/testing only. Unverifiable observations are not treated as absences.
