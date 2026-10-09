# KaushalLens
## AI-Powered Skill Centre Monitoring & Compliance Portal

**Document status:** Product requirements specification  
**Version:** 1.0  
**Date:** 9 October 2026  
**Product owner:** Ministry of Skill Development and Entrepreneurship (MSDE)  
**Primary users:** National administrators, state monitoring officers, district officers, centre managers, auditors, and read-only stakeholders

---

## 1. Executive summary

KaushalLens is a secure, multi-user monitoring and compliance platform for government-funded skill development centres across India. It gives MSDE and delegated officers a unified operational view of centre activity, attendance, infrastructure, camera availability, evidence, alerts, cases, reports, and corrective actions.

The product replaces fragmented spreadsheets, periodic manual reporting, and disconnected inspection workflows with a role-aware command centre that supports near-real-time visibility, accountability, and audit-ready records.

---

## 2. Problem statement

MSDE stakeholders need to answer, quickly and reliably:

- Which skill centres are active and operational?
- Are attendance records consistent with observed occupancy?
- Which centres have missing, unreliable, or low-quality evidence?
- Which infrastructure and camera issues require intervention?
- Who owns each corrective action and when is it due?
- How do centre, district, state, and national performance compare?
- Can every decision be supported by an auditable history?

Current workflows make this difficult because data is distributed across systems, updates are delayed, ownership is unclear, and high-priority exceptions are difficult to identify.

---

## 3. Product goals

### Primary goals

1. Establish one operational source of truth for skill-centre monitoring.
2. Provide role-specific dashboards for national, state, district, centre, and audit users.
3. Detect attendance, infrastructure, camera, and evidence exceptions early.
4. Convert alerts into owned cases with due dates, evidence, comments, and resolution history.
5. Support transparent hierarchical monitoring from national to centre level.
6. Generate reliable, exportable, audit-ready reports.
7. Protect sensitive operational data through strong authentication, authorization, and audit logging.

### Non-goals for v1

- Replacing the official attendance, MIS, or funding systems.
- Processing payroll or participant payments.
- Making final funding or enforcement decisions automatically.
- Publicly exposing personally identifiable learner data.
- Fully autonomous compliance decisions without human review.

---

## 4. Users and roles

| Role | Scope | Core responsibilities |
|---|---|---|
| National Admin | All India | Configure programme, monitor national position, manage users, review escalations, publish reports |
| State Monitoring Officer | Assigned state(s) | Monitor state performance, investigate alerts, assign district actions, approve closures |
| District Officer | Assigned district(s) | Review centres, coordinate visits, track remediation, validate evidence |
| Centre Manager | Assigned centre | Maintain centre profile, respond to cases, upload evidence, acknowledge alerts |
| Auditor / Reviewer | Granted read scope | Review records, evidence, case history, and exports without changing operational data |
| Executive Viewer | Read-only aggregate scope | View approved dashboards and high-level reports |
| Platform Administrator | Technical administration | Manage access, integrations, reference data, security settings, and system health |

### Role principles

- Least-privilege access is mandatory.
- Every user belongs to an organization and geographic scope.
- Users can only access centres permitted by role, assignment, and policy.
- Sensitive actions require confirmation and are logged.
- Delegation and temporary access must have an expiry date.

---

## 5. Geographic and organizational model

The hierarchy is:

**India → State / UT → District → Centre → Facility / Room / Device**

The portal must support all current Indian states and union territories as reference data, with official names, codes, districts, centre identifiers, and configurable programme ownership. Geographic boundaries and assignments must be versioned so historical reports remain correct after administrative changes.

Each centre should have:

- Official centre name and centre ID
- State, district, address, latitude, and longitude
- Managing organization and funding programme
- Centre manager and escalation contacts
- Courses, batches, sanctioned capacity, and active enrolment
- Infrastructure checklist
- Camera/device inventory and connectivity status
- Last inspection, last evidence submission, and current compliance status

---

## 6. Core product modules

### 6.1 Authentication and workspace selection

- Login page with email or official user ID and password.
- Optional organization, role, or workspace selection when a user has multiple assignments.
- Password reset, account lockout protection, session timeout, and sign out.
- MFA support for privileged roles.
- Clear error states without revealing whether an account exists.
- Post-login redirect to the user’s permitted command centre.

### 6.2 Command centre dashboard

The default dashboard must provide:

- Active centres
- Cameras online and offline
- Open alerts by priority
- Centres needing attention
- Attendance discrepancy trend
- Alert-priority breakdown
- Centres needing review table
- Recent alerts and case activity
- State, district, and date-range filters
- Search across centres, states, districts, and centre IDs
- Refresh and last-updated indicators

The dashboard should follow the approved KaushalLens visual direction: deep navy navigation, white content surfaces, teal operational accents, blue information states, amber warnings, and coral/red critical states.

### 6.3 Centre directory

- Searchable, filterable centre list.
- Map and table views.
- Centre status, attendance match, infrastructure score, camera status, open cases, and last activity.
- Centre detail page with overview, activity, attendance, infrastructure, devices, evidence, cases, and audit timeline.
- Export filtered results subject to permissions.

### 6.4 Live monitoring

- Camera/device online status.
- Last heartbeat and connectivity duration.
- Feed health and obstruction/low-light signals where supported.
- Device details, assignment, firmware/status, and last incident.
- Clear distinction between unavailable feed, offline device, and unverified data.

### 6.5 Attendance monitoring

- Compare reported attendance with observed occupancy or validated evidence.
- Show discrepancy percentage, volume, threshold, and trend.
- Drill from national aggregate to state, district, centre, batch, and date.
- Configurable thresholds by programme or centre type.
- Flag anomalies for review; never silently alter source attendance.

### 6.6 Infrastructure compliance

- Configurable inspection checklist.
- Categories for classrooms, workshops, safety, accessibility, equipment, sanitation, power, and connectivity.
- Evidence attachments, inspector notes, score, status, and due date.
- Scheduled and ad hoc inspections.
- Centre remediation workflow with reinspection.

### 6.7 Alerts and cases

Alert types include attendance discrepancy, camera obstruction, offline centre, missing evidence, infrastructure non-compliance, low-light evidence, overdue action, and data-quality failure.

Each alert can become a case with:

- Severity and source
- Centre and geographic scope
- Owner and watchers
- Status: New, Acknowledged, In progress, Awaiting evidence, Resolved, Rejected, Reopened
- SLA and due date
- Comments and internal notes
- Evidence and activity timeline
- Escalation path
- Resolution reason and approval

### 6.8 Reports and exports

- National, state, district, centre, attendance, infrastructure, device health, alert, and case reports.
- Date, geography, programme, status, and severity filters.
- CSV and PDF export according to role permissions.
- Scheduled report delivery for authorized users.
- Report snapshot metadata: creator, filters, generated time, data freshness, and version.

### 6.9 User and access administration

- Invite, deactivate, reactivate, and remove users.
- Assign role, organization, state, district, and centre scope.
- Pending invitations and expiry handling.
- Role change history.
- User sessions and sign-out-all capability for administrators.
- Bulk import with validation and duplicate detection.

### 6.10 Settings and reference data

- Profile, notification preferences, security, and session management.
- Alert thresholds and SLA policies.
- Programme and centre-type configuration.
- State, district, centre, course, batch, and device reference data.
- Integration health and data-sync status.
- Branding and accessibility settings controlled by platform administrators.

---

## 7. Key workflows

### 7.1 Login to command centre

1. User opens the login page.
2. User enters credentials.
3. System authenticates and evaluates role and geographic scope.
4. If multiple workspaces exist, user selects one.
5. System opens the permitted dashboard with correct filters.
6. Login event is recorded.

### 7.2 Alert to resolution

1. Monitoring rule creates an alert.
2. Alert receives severity, SLA, and geographic owner.
3. Assigned officer acknowledges it.
4. Officer assigns or accepts the case.
5. Centre provides evidence or corrective action.
6. Reviewer validates the evidence.
7. Case is resolved, rejected, or reopened.
8. Complete history remains available for audit.

### 7.3 Inspection and remediation

1. Officer schedules or starts an inspection.
2. Checklist is completed with notes and evidence.
3. System calculates compliance status.
4. Failed items become actions with owners and due dates.
5. Centre submits remediation evidence.
6. Officer validates and closes or reopens the item.

### 7.4 Add a user

1. Authorized admin selects Add user.
2. Admin enters identity, role, organization, and scope.
3. System validates required fields and conflicts.
4. Invitation is created with expiry and audit record.
5. User completes account setup.
6. Admin can review status and revoke the invitation.

---

## 8. Functional requirements

### Must have for v1

- Secure multi-user authentication.
- Role-based and geography-scoped authorization.
- Command centre with live freshness indicators.
- Centre directory and centre details.
- Alerts, cases, ownership, SLA, evidence, and audit history.
- Attendance and infrastructure monitoring views.
- User invitation and access administration.
- State and district reference data for India.
- Search, filters, pagination, and export.
- Responsive desktop-first interface with accessible keyboard navigation.
- Server-side validation, error handling, and activity logging.

### Should have

- MFA for privileged roles.
- Scheduled reports.
- Map view and geospatial centre clustering.
- Bulk centre/user imports.
- Notification channels for email and in-app alerts.
- Data-quality monitoring and sync health dashboard.

### Could have

- Mobile field-inspection experience.
- Offline inspection capture with later sync.
- Predictive risk scoring.
- Natural-language operational summaries.
- Automated evidence quality classification.

---

## 9. Data model

Core entities:

- User
- Role
- Organization
- UserScope
- State
- District
- Centre
- Facility
- Device
- Programme
- Course
- Batch
- AttendanceRecord
- InfrastructureInspection
- InspectionItem
- Evidence
- Alert
- Case
- CaseComment
- CaseAssignment
- Notification
- Report
- AuditEvent
- DataSyncRun

All operational entities must include stable IDs, created/updated timestamps, creator/updater references, and soft-delete or archival behavior where appropriate. Audit events must be append-only.

---

## 10. Integrations and data contracts

Potential integrations should be implemented behind versioned adapters rather than tightly coupled to the UI:

- Official attendance or MIS source
- Centre and beneficiary master data
- Camera/device monitoring provider
- Identity provider or government directory
- Email/SMS notification provider
- Object storage for evidence
- Analytics and observability platform

Each integration requires:

- Authentication and secret management
- Input/output schema validation
- Idempotent sync behavior
- Retry and dead-letter handling
- Last successful sync timestamp
- Error visibility to authorized admins
- Reconciliation report

The portal must label data as **Live**, **Delayed**, **Stale**, **Unavailable**, or **Manual** so users do not mistake missing data for a clean result.

---

## 11. Security, privacy, and compliance

- Use secure server-side sessions and HttpOnly, Secure, SameSite cookies.
- Enforce password hashing, rate limiting, lockout, and password recovery controls.
- Apply authorization on every server-side read and write.
- Scope all queries to the authenticated user’s organization and geographic assignment.
- Encrypt data in transit and at rest.
- Store evidence in private storage with signed, expiring access URLs.
- Minimize and mask personally identifiable information.
- Maintain immutable audit events for login, access, exports, configuration, assignments, and case changes.
- Add baseline security headers in production.
- Define retention and deletion policies for operational data and evidence.
- Provide incident response, backup, recovery, and access-review procedures.

---

## 12. UX and design requirements

### Visual direction

- Ministry-grade, credible, calm, and operational rather than decorative.
- Deep navy sidebar with official identity area.
- Light content canvas with white cards and subtle borders.
- Teal for healthy/online/compliant states.
- Blue for information and primary actions.
- Amber for warnings and review-required states.
- Coral/red for critical and offline states.
- Use no more than two font families and maintain strong contrast.

### Layout

- Persistent navigation on desktop with collapse/expand behavior.
- On collapsed navigation, icons remain visible and labels reappear on hover or focus.
- Back button on detail and workflow pages, preserving filter context where possible.
- Responsive mobile layout with a drawer navigation.
- Every data table needs empty, loading, error, and no-results states.
- Destructive actions require confirmation.
- All icon-only controls require accessible labels and tooltips.

### Accessibility

Target WCAG 2.2 AA:

- Keyboard-complete navigation.
- Visible focus indicators.
- Semantic headings and landmarks.
- Correct labels, descriptions, roles, and live regions.
- Color is never the only status signal.
- Minimum readable contrast and scalable text.
- Screen-reader-friendly tables, charts, dialogs, and form validation.

---

## 13. Non-functional requirements

- Dashboard initial render: target under 2.5 seconds on a normal broadband connection.
- Common filtered queries: target under 1 second at the API layer.
- 99.9% monthly availability for production, excluding planned maintenance.
- Support at least 10,000 authenticated users, 10,000 centres, and 100 million attendance records through indexed, paginated access patterns.
- No client-side persistence of sensitive operational data.
- Background jobs must be retryable and observable.
- All APIs must return structured errors and correlation IDs.
- Production deployments must include monitoring, alerting, backups, and rollback capability.

---

## 14. Analytics and success metrics

### Product metrics

- Weekly active monitoring officers.
- Percentage of centres with current data.
- Percentage of alerts acknowledged within SLA.
- Median time from alert creation to assignment.
- Median time from case creation to resolution.
- Percentage of cases reopened after validation.
- Attendance discrepancy detection rate.
- Evidence submission and validation rate.
- Report generation success rate.
- User invitation acceptance rate.

### Outcome indicators

- Reduction in unresolved critical alerts.
- Reduction in stale or missing centre data.
- Improvement in inspection completion rate.
- Reduction in time spent compiling manual reports.
- Increased audit trace completeness.

---

## 15. Delivery phases

### Phase 1: Foundation

Authentication, role and geography model, centre master data, design system, navigation, dashboard shell, audit logging, and platform administration.

### Phase 2: Monitoring operations

Centre directory, centre details, attendance monitoring, infrastructure checklists, device status, alerts, cases, assignments, evidence, and notifications.

### Phase 3: Reporting and governance

Reports, exports, scheduled delivery, data-quality dashboard, reconciliation, access reviews, and operational analytics.

### Phase 4: Intelligence and scale

Risk scoring, anomaly detection, evidence quality assistance, mobile field workflows, offline capture, and advanced integrations.

---

## 16. Acceptance criteria

The product is ready for a production pilot when:

1. A user can log in and only see assigned data.
2. Each role receives the correct dashboard and available actions.
3. National, state, district, and centre drill-downs preserve scope and filters.
4. A monitoring rule creates an alert with severity, owner, SLA, and audit event.
5. An alert can progress through the full case lifecycle with evidence and approval.
6. Centre, state, and district names are sourced from controlled reference data.
7. Admins can invite, scope, deactivate, and audit users.
8. Reports reconcile with dashboard totals for the same filters and freshness window.
9. Loading, empty, error, stale-data, and permission-denied states are implemented.
10. Critical workflows pass keyboard and screen-reader accessibility checks.
11. Security review confirms authorization, session, upload, export, and audit controls.
12. Production monitoring, backups, incident response, and rollback procedures are documented and tested.

---

## 17. Open decisions

- Which official attendance and centre master systems are the source of truth?
- Which camera/device provider and telemetry protocol will be used?
- Which government identity provider is required for production authentication?
- What are the approved attendance discrepancy and infrastructure thresholds?
- What are the SLA targets by alert severity and role?
- Which data classes require masking, retention limits, or approval before export?
- Which states and centres are included in the pilot?
- Is map functionality required for v1 or Phase 2?
- Which notification channels are approved for operational use?

---

## 18. Recommended pilot

Start with a controlled pilot across a representative group of states, districts, and centre types. Include national, state, district, centre, and audit users. Measure data freshness, alert quality, case resolution time, user adoption, and reconciliation accuracy before expanding nationally.

The pilot should use production-like access controls and audit logging from day one, even if initial data feeds are limited or partially manual.

---

## 19. Product principle

**Make the right operational issue visible to the right person, with enough evidence to act, and a complete record of what happened next.**
``` 
 vu 
``` 

*End of PRD* 
