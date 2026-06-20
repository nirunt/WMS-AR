# Implementation Roadmap
**U&V Holding LIMS-BMS**
Version 1.0 · 2026-06-20

---

## Overview

The project is split into 6 sequential phases. Each phase produces a
working, deployable increment. Phases 1–4 deliver the core production
workflow; phases 5–6 complete the operational experience.

| Phase | Name | Est. Duration | Key Deliverable |
|-------|------|:-------------:|-----------------|
| 1 | Foundation | 1 week | Working shell: auth, DB, navigation |
| 2 | Product & Batch Core | 1.5 weeks | Create/manage batches end-to-end |
| 3 | QC Workflow | 1.5 weeks | QC reports, approval state machine |
| 4 | COA & PDFs | 1 week | Certificate generation and verification |
| 5 | Dashboard & Search | 1 week | KPIs, charts, global search |
| 6 | Polish & Production Ready | 1 week | Notifications, audit viewer, Docker, i18n |

Total estimated: **~7 weeks** for a 1–2 developer team.

---

## Phase 1 — Foundation

**Goal:** A deployable skeleton where authenticated users can navigate the
shell. No business logic yet.

### Tasks

#### 1.1 Project Bootstrap
- [x] `npx create-next-app@latest` with TypeScript + Tailwind + App Router
- [ ] Install and configure shadcn/ui
- [ ] Configure Tailwind design tokens (primary `#003B73`, secondary `#00AEEF`)
- [ ] Set up ESLint + Prettier + TypeScript strict mode
- [ ] Configure `next-intl` with `th` (default) and `en` locales
- [ ] Create `messages/th.json` and `messages/en.json` stub files

#### 1.2 Database Setup
- [ ] Add Prisma, configure `DATABASE_URL`
- [ ] Write `prisma/schema.prisma` for all models (as per ERD)
- [ ] Run initial migration
- [ ] Write seed script: admin user, 8 product master records

#### 1.3 Authentication
- [ ] Configure NextAuth v5 with Credentials provider
- [ ] Implement bcrypt password hashing in `lib/auth.ts`
- [ ] Build Login page (`/login`) with RHF + Zod validation
- [ ] Add JWT session type augmentation (`types/next-auth.d.ts`)
- [ ] Create `withAuth` and `withRole` API middleware helpers

#### 1.4 Application Shell
- [ ] Root layout with `SessionProvider`
- [ ] Authenticated layout with Sidebar + TopBar
- [ ] Sidebar navigation links (role-filtered)
- [ ] Language toggle (TH/EN) in TopBar
- [ ] User menu (profile, logout) in TopBar
- [ ] Notification bell (icon + count badge, no content yet)
- [ ] Breadcrumb component

#### 1.5 Docker Setup
- [ ] `Dockerfile` (multi-stage: deps → builder → runner)
- [ ] `docker-compose.yml` (app + postgres)
- [ ] `.env.example` with all required vars
- [ ] Health check endpoint `GET /api/health`

**Exit criteria:** Any team member can `docker compose up`, log in as admin,
and see the navigation shell. All pages show "Coming Soon" placeholders.

---

## Phase 2 — Product & Batch Core

**Goal:** Production team can create batches with raw material entries and
batch reports (including e-signature). Batch progresses to QC_PENDING.

### Tasks

#### 2.1 Product Master Module
- [ ] `ProductTable` — paginated list, search by code/name
- [ ] `ProductForm` — create/edit with TH+EN fields, shelf life, storage
- [ ] `GET /api/v1/products` with filters
- [ ] `POST /api/v1/products` with Zod validation
- [ ] `PATCH /api/v1/products/[id]`
- [ ] Soft-delete (Admin only)

#### 2.2 QC Template Management
- [ ] `QCTemplateEditor` — add/reorder/delete test items with drag-and-drop
- [ ] Template linked to product in Product form
- [ ] Template versioning on update (increment `version`, keep history)
- [ ] API routes for templates + items

#### 2.3 Batch Creation
- [ ] `BatchForm` — product selector, manufacturing date, quantity, notes
- [ ] Auto-calculate expiry date from `shelf_life_days`
- [ ] Atomic batch number generation (`SequenceService` with `SELECT FOR UPDATE`)
- [ ] `POST /api/v1/batches`
- [ ] `BatchTable` — filterable by status, product, date range
- [ ] Batch detail page (`/batches/[id]`) with status timeline

#### 2.4 Raw Material Entry
- [ ] `RawMaterialTable` (inline on batch detail page)
- [ ] `RawMaterialForm` — add/edit/delete entries
- [ ] CRUD API routes under `/api/v1/batches/[id]/raw-materials/`

#### 2.5 Batch Report
- [ ] `BatchReportForm` — start/end time, equipment, process checklist (from product spec template), deviation report
- [ ] `ProcessChecklist` — dynamic checklist rendered from product's `spec_template` JSONB
- [ ] `AttachmentUploader` — drag-drop file upload (photos, docs)
- [ ] `StorageAdapter` local implementation + upload API route
- [ ] `SignatureCapture` — typed full name confirmation dialog
- [ ] E-signature API: validate session, write `signature_meta` JSONB, set `is_signed`
- [ ] Once signed: lock report fields (API enforces + UI disables form)

#### 2.6 Submit for QC
- [ ] "Submit for QC" button (visible to Production when report is signed)
- [ ] `POST /api/v1/batches/[id]/submit` — validates report is signed, transitions to `QC_PENDING`
- [ ] Audit trail entry written in same transaction
- [ ] Console notification stub called

**Exit criteria:** Production user creates batch → fills raw materials → completes
batch report → signs → submits. Batch status shows QC_PENDING.

---

## Phase 3 — QC Workflow

**Goal:** QC officer reviews and completes the QC report; manager approves or
rejects; batch reaches RELEASED status.

### Tasks

#### 3.1 QC Report
- [ ] `QCReportForm` — renders template items as editable rows
- [ ] Template snapshot: copy items into `qc_report_items` on report creation
- [ ] Per-row: result input, PASS/FAIL select, comment
- [ ] Auto-compute `overall_result` server-side on submit
- [ ] `QCResultBadge` component (green PASS / red FAIL)
- [ ] QC report e-signature (same `SignatureCapture` component)
- [ ] `POST /api/v1/batches/[id]/qc-report`
- [ ] `PATCH /api/v1/batches/[id]/qc-report`
- [ ] `POST /api/v1/batches/[id]/qc-report/sign`

#### 3.2 QC Approve / Reject
- [ ] `POST /api/v1/batches/[id]/qc-approve` — creates Approval record, transitions to `QC_APPROVED` → `PENDING_MANAGER_APPROVAL`
- [ ] `POST /api/v1/batches/[id]/qc-reject` — creates Approval record (with reason), transitions to `QC_REJECTED`
- [ ] Confirm dialog with comment textarea for both actions
- [ ] Both transitions wrapped in DB transaction with row-level lock on batch

#### 3.3 Manager Approval
- [ ] Manager sees batches in `PENDING_MANAGER_APPROVAL`
- [ ] Batch detail shows QC report summary + QC signature
- [ ] `POST /api/v1/batches/[id]/approve` — transitions to `RELEASED`
- [ ] `POST /api/v1/batches/[id]/reject` — transitions to `REJECTED`
- [ ] Approval records written atomically with status transition

#### 3.4 Audit Trail (Core)
- [ ] `AuditService.record(...)` helper
- [ ] Called in every service method that mutates state
- [ ] Captures `old_values`, `new_values`, `changed_fields`, `ip_address`

#### 3.5 Notifications (Stub)
- [ ] `NotificationService` interface + `ConsoleNotificationService`
- [ ] Persist notification rows to DB for all workflow events
- [ ] In-app notification bell: show unread count + dropdown list
- [ ] Mark-as-read API

**Exit criteria:** Full workflow from DRAFT → QC_PENDING → QC_APPROVED →
PENDING_MANAGER_APPROVAL → RELEASED is demonstrable. Rejection path also works.

---

## Phase 4 — COA & PDF Generation

**Goal:** Manager can generate and download COA PDFs; public QR verification works.

### Tasks

#### 4.1 COA Generation
- [ ] "Generate COA" button (visible to Manager when batch is RELEASED)
- [ ] `COAService.generate(batchId)` — builds COA record, generates PDF, stores file
- [ ] Atomic COA number generation (`coa_sequences` table)
- [ ] `POST /api/v1/coas`

#### 4.2 PDF Templates
- [ ] Install `@react-pdf/renderer`
- [ ] `COAPDF.tsx` — company logo, product info, batch/expiry dates, QC results table, overall result, issue date, COA number, authorized signature block, QR code
- [ ] `BatchReportPDF.tsx` — full batch report including checklist and e-signature block
- [ ] `QCReportPDF.tsx` — QC results table with pass/fail per item and e-signature
- [ ] `PDFGenerator.generate(template, props)` → returns Buffer
- [ ] `GET /api/v1/coas/[coa_number]/pdf` — streams PDF from storage

#### 4.3 QR Code Integration
- [ ] `qrcode` npm package installed
- [ ] QR encodes `{APP_URL}/coa/{coa_number}`
- [ ] QR PNG embedded in COA PDF as base64
- [ ] QR also displayed on COA detail page

#### 4.4 Public Verification Page
- [ ] `/coa/[coa_number]` — publicly accessible (no auth required)
- [ ] Shows: product name (EN), batch number, COA number, issue date, overall result
- [ ] No internal QC details exposed
- [ ] Green/red visual result indicator
- [ ] Mobile-friendly layout (QR scan use case)
- [ ] `GET /api/v1/verify/[coa_number]` — minimal public API endpoint

#### 4.5 COA List
- [ ] `COATable` with filters by product, date range, COA number
- [ ] Download PDF link per row
- [ ] Revoke COA action (Admin only, with reason)

**Exit criteria:** Manager clicks "Generate COA" → PDF downloads → QR code
scans to a clean public verification page.

---

## Phase 5 — Dashboard & Global Search

**Goal:** Dashboard shows live KPIs and trends; search works across all modules.

### Tasks

#### 5.1 Dashboard KPIs
- [ ] `GET /api/v1/dashboard` endpoint (single query, aggregated)
- [ ] Today's batches produced (count)
- [ ] Batches pending QC (count + badge)
- [ ] Batches pending manager approval (count + badge)
- [ ] Released batches this month (count)
- [ ] Rejected batches this month (count)
- [ ] Recent COAs (last 5, with links)
- [ ] QC pass rate this month (percentage)
- [ ] `KPICard` component — icon, label, value, optional color coding

#### 5.2 Monthly Trend Charts
- [ ] Monthly production volume (bar chart — batches count by product)
- [ ] QC pass/fail rate per month (stacked bar or line)
- [ ] Powered by Recharts
- [ ] Date range selector (rolling 6 months default)

#### 5.3 Global Search
- [ ] `SearchInput` in TopBar (keyboard shortcut: Ctrl+K)
- [ ] Full-text search across: batch_number, coa_number, product_code, product_name_th, product_name_en, raw material lot_number
- [ ] Results grouped by entity type (Batches, COAs, Products)
- [ ] Clickable results navigate to the relevant page
- [ ] `GET /api/v1/search?q=...` endpoint using PostgreSQL `ILIKE` and `ts_vector`

#### 5.4 Advanced Filters
- [ ] Batch list: filter by status, product, date range, operator
- [ ] COA list: filter by product, date range, result
- [ ] Filters persist in URL query params for shareable links

**Exit criteria:** Admin can see live KPI cards, monthly trend charts, and
find any batch or COA by partial number/name in under 2 keystrokes.

---

## Phase 6 — Polish & Production Readiness

**Goal:** System ready for live use by manufacturing team; Thai UI complete; Docker production config finalized.

### Tasks

#### 6.1 SMTP Notifications
- [ ] `SmtpNotificationService` using NodeMailer
- [ ] Email templates (HTML, bilingual TH/EN subject lines)
- [ ] Switch from console adapter via `NOTIFICATION_ADAPTER=smtp` env var
- [ ] Test SMTP connectivity check on startup

#### 6.2 Audit Trail Viewer
- [ ] `AuditTrailTable` — paginated, filterable by entity type, user, date
- [ ] Expandable row showing old_values / new_values as JSON diff
- [ ] Admin-only access enforced at both route and API level
- [ ] Export audit log to CSV

#### 6.3 Internationalisation Completion
- [ ] Complete `messages/th.json` — all UI strings in Thai
- [ ] Complete `messages/en.json` — English equivalents
- [ ] Buddhist Era date display option for TH locale
- [ ] Number formatting (Thai locale)
- [ ] Status labels localised (e.g. "รอการตรวจสอบ" for QC_PENDING)

#### 6.4 User Management (Admin)
- [ ] User list: name, email, role, last login, active status
- [ ] Create user with temporary password (force-change on first login)
- [ ] Edit user role / active status
- [ ] Password change (self-service) on profile page
- [ ] Deactivate user (soft delete, existing records preserved)

#### 6.5 Production Docker Config
- [ ] Multi-stage `Dockerfile` (build → runner, minimal image)
- [ ] `docker-compose.yml` production profile with Nginx reverse proxy
- [ ] Nginx config: gzip, proxy headers, static file caching
- [ ] Database migration run on container startup (`prisma migrate deploy`)
- [ ] Health check endpoint wired to Docker healthcheck
- [ ] Log level configuration via `LOG_LEVEL` env var

#### 6.6 Security Hardening
- [ ] Content-Security-Policy header in `next.config.ts`
- [ ] Rate limiting on `/api/auth/signin` (10 req/min per IP)
- [ ] Helmet-style security headers (X-Frame-Options, X-Content-Type-Options)
- [ ] File upload: MIME type validation, size limit (20 MB), virus scan hook (stub)
- [ ] Session invalidation on password change

#### 6.7 Testing
- [ ] Unit tests: `SequenceService`, `BatchService.computeExpiry`, `QCService.computeOverallResult`
- [ ] API integration tests: batch workflow state machine (happy path + error cases)
- [ ] E2E smoke test: create batch → QC approve → COA generate (Playwright)

**Exit criteria:** System passes security review, all Thai strings display correctly,
Docker production build runs clean with `docker compose --profile production up`.

---

## Post-Phase Backlog (Future Scope)

| Item | Notes |
|------|-------|
| S3 file storage | Swap `LocalStorageAdapter` → `S3StorageAdapter`, zero code changes elsewhere |
| SMTP email | Already architected; enable via env var |
| Drawn / PIN e-signature | Schema already supports `method` field extension |
| Thai COA PDF | Parallel TH version of COA template |
| SSO / LDAP | NextAuth supports additional providers without rearchitecting |
| Mobile app (read-only) | API is REST; mobile client can consume directly |
| Label printing | Barcode label for batch/product using a label printer service |
| Advanced analytics | Export to Excel; more chart types |
| Multi-plant support | Add `facility_id` foreign key to batches |
