# LIMS / Batch Management System — Architecture Document
**U&V Holding (Thailand) Co., Ltd.**
Version 1.0 · 2026-06-20

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Security & Authentication](#4-security--authentication)
5. [Module Breakdown](#5-module-breakdown)
6. [Notification Architecture](#6-notification-architecture)
7. [File Storage Architecture](#7-file-storage-architecture)
8. [PDF Generation Architecture](#8-pdf-generation-architecture)
9. [Electronic Signature Design](#9-electronic-signature-design)
10. [Internationalisation (i18n)](#10-internationalisation-i18n)

---

## 1. System Overview

A web-based Laboratory Information / Batch Management System (LIMS-BMS) that tracks the full lifecycle of every manufactured batch from production through QC, manager approval, certificate issuance, and archival.

### Core Capabilities

| Module | Description |
|--------|-------------|
| Product Master | Canonical product catalogue with TH/EN names and template links |
| Batch Management | Create, track, and progress batches through the approval workflow |
| Raw Material Traceability | Per-batch RM consumption records |
| Batch Report | Production log, equipment, checklist, deviation, attachments, e-sign |
| QC Report | Template-driven test results with automatic pass/fail decision |
| COA | PDF certificate with QR verification code |
| Dashboard | KPI widgets and monthly trend charts |
| Search | Cross-module search by all key identifiers |
| Audit Trail | Immutable who/what/when log for every state change |
| Notifications | Pluggable email/event notifications per workflow step |

### Batch Status State Machine

```
DRAFT
  │  (Production team marks complete)
  ▼
PRODUCTION_COMPLETE
  │  (System auto-transitions on batch report submission)
  ▼
QC_PENDING
  │
  ├──[QC Approves]──► QC_APPROVED
  │                        │  (System creates Approval request)
  │                        ▼
  │                   PENDING_MANAGER_APPROVAL
  │                        │
  │                        ├──[Manager Approves]──► RELEASED ──► ARCHIVED
  │                        │
  │                        └──[Manager Rejects]──► REJECTED
  │
  └──[QC Rejects]──► QC_REJECTED
                          │  (Production may revise and resubmit)
                          ▼
                       DRAFT (revision)
```

> All status transitions are wrapped in DB transactions with optimistic locking
> to prevent race conditions when two sessions act on the same batch.

---

## 2. Technology Stack

### Frontend
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | SSR + API routes in one repo, great DX |
| Language | TypeScript 5 | Type safety across client and server |
| Styling | Tailwind CSS 3 | Utility-first, consistent design tokens |
| Component Library | shadcn/ui (Radix UI primitives) | Accessible, unstyled base, easy theming |
| Charts | Recharts | Lightweight, composable React charts |
| PDF Preview | react-pdf | In-browser PDF rendering |
| Form Management | React Hook Form + Zod | Performant forms with schema validation |
| State | Zustand (client) + TanStack Query (server) | Minimal global state; server data via RQ |
| Icons | Lucide React | Consistent icon set used by shadcn/ui |

### Backend
| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | Next.js API Routes (Route Handlers) | Co-located with UI, no extra service needed |
| ORM | Prisma 5 | Type-safe queries, migration management |
| Database | PostgreSQL 15 | ACID, JSON columns for flexible templates |
| Auth | NextAuth v5 (Auth.js) | Credentials provider; extensible for SSO |
| Session | JWT (server-side session cookie) | Stateless, works with Next.js edge |
| PDF Generation | Puppeteer (server-side) or @react-pdf/renderer | Rendered from React templates |
| QR Code | qrcode npm package | COA verification QR generation |
| File Storage | Local disk (phase 1); abstracted StorageAdapter | Ready for S3 swap |
| Email (stub) | NodeMailer / console logger | Pluggable NotificationService interface |
| Validation | Zod (shared schemas, client + server) | Single source of truth |

### Infrastructure
| Concern | Choice |
|---------|--------|
| Containerisation | Docker + docker-compose |
| DB Container | postgres:15-alpine |
| App Container | node:20-alpine multi-stage build |
| Environment Config | .env files; Docker secrets in production |
| Reverse Proxy | Nginx (optional, docker-compose profile) |
| Process Manager | Built-in Next.js server (production: `next start`) |

---

## 3. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│  Next.js App Router pages (RSC + Client Components)             │
│  TanStack Query  │  React Hook Form  │  shadcn/ui components    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                  Next.js Server (Node.js)                        │
│                                                                  │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │ Page RSCs    │  │  API Routes    │  │  NextAuth Handler    │ │
│  │ (data fetch) │  │ /api/v1/**     │  │  /api/auth/**        │ │
│  └──────────────┘  └───────┬────────┘  └──────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                  Service Layer                               │ │
│  │  BatchService │ QCService │ COAService │ AuditService       │ │
│  │  NotificationService (interface) │ StorageService (interface)│ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                   Prisma ORM                                 │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└───────────────────────────  │  ────────────────────────────────── ┘
                              │
              ┌───────────────▼──────────────┐
              │         PostgreSQL 15          │
              └───────────────────────────────┘

              ┌───────────────────────────────┐
              │    Local Disk / Future S3      │
              │   (files, PDFs, attachments)   │
              └───────────────────────────────┘
```

### API Route Structure

All API routes live under `/api/v1/` and follow RESTful conventions with verb-based extensions where REST verbs are insufficient:

```
POST   /api/v1/auth/...                  NextAuth handlers
GET    /api/v1/products                  List products
POST   /api/v1/products                  Create product
GET    /api/v1/products/[id]             Get product
PATCH  /api/v1/products/[id]             Update product

GET    /api/v1/batches                   List (filterable)
POST   /api/v1/batches                   Create batch
GET    /api/v1/batches/[id]              Get batch detail
PATCH  /api/v1/batches/[id]              Update batch
POST   /api/v1/batches/[id]/submit       Submit for QC
POST   /api/v1/batches/[id]/qc-approve   QC approve
POST   /api/v1/batches/[id]/qc-reject    QC reject
POST   /api/v1/batches/[id]/approve      Manager approve
POST   /api/v1/batches/[id]/reject       Manager reject
POST   /api/v1/batches/[id]/archive      Archive

GET    /api/v1/batches/[id]/report       Get batch report
POST   /api/v1/batches/[id]/report       Create/update batch report
POST   /api/v1/batches/[id]/report/sign  Apply e-signature

GET    /api/v1/batches/[id]/qc-report    Get QC report
POST   /api/v1/batches/[id]/qc-report    Create QC report
PATCH  /api/v1/batches/[id]/qc-report    Update QC report

GET    /api/v1/coas                      List COAs
POST   /api/v1/coas                      Generate COA
GET    /api/v1/coas/[coa_number]         Get COA
GET    /api/v1/coas/[coa_number]/pdf     Download COA PDF

GET    /api/v1/verify/[coa_number]       Public COA verification (no auth)

GET    /api/v1/dashboard                 Dashboard KPIs
GET    /api/v1/search                    Global search

GET    /api/v1/audit-trail               Paginated audit log (admin only)

GET    /api/v1/qc-templates              List templates
POST   /api/v1/qc-templates              Create template
PATCH  /api/v1/qc-templates/[id]        Update template

POST   /api/v1/uploads                   Upload attachment
GET    /api/v1/uploads/[id]              Download attachment
```

### Role-Based Access Control (RBAC)

| Action | Admin | Production | QC | Manager |
|--------|:-----:|:----------:|:--:|:-------:|
| Manage Product Master | ✓ | | | |
| Manage Users | ✓ | | | |
| Create Batch | ✓ | ✓ | | |
| Edit Batch (DRAFT) | ✓ | ✓ | | |
| Submit Batch for QC | ✓ | ✓ | | |
| Create/Edit Batch Report | ✓ | ✓ | | |
| Sign Batch Report | ✓ | ✓ | | |
| Create QC Report | ✓ | | ✓ | |
| QC Approve / Reject | ✓ | | ✓ | |
| Manager Approve / Reject | ✓ | | | ✓ |
| Generate COA | ✓ | | | ✓ |
| View All Records | ✓ | | | ✓ |
| View Own Batches | ✓ | ✓ | ✓ | ✓ |
| View Audit Trail | ✓ | | | |
| Manage QC Templates | ✓ | | ✓ | |

---

## 4. Security & Authentication

### Authentication Flow

```
1. User submits credentials → POST /api/auth/signin
2. NextAuth verifies against DB (bcrypt hash)
3. JWT issued (httpOnly cookie, Secure, SameSite=Lax)
4. JWT payload: { sub: userId, role: UserRole, name, email, iat, exp }
5. JWT refreshed server-side on each request (session sliding window)
6. All API routes: middleware validates JWT, attaches session to request context
```

### Security Controls

- Passwords: bcrypt (cost factor 12)
- JWT: HS256, 8-hour expiry, httpOnly + Secure cookie
- CSRF: Next.js built-in + SameSite cookie
- SQL Injection: Prisma parameterised queries (no raw SQL in application code)
- XSS: React's default escaping; Content-Security-Policy header via next.config
- Rate limiting: next-rate-limit middleware on auth endpoints (10 req/min)
- Input validation: Zod schemas on all API routes before Prisma calls
- Soft delete: `deleted_at` timestamp; hard delete disabled at DB level by app
- Audit trail: every mutation writes an immutable audit record in a transaction

---

## 5. Module Breakdown

### 5.1 Product Master

**Stored data:**

| Field | Type | Notes |
|-------|------|-------|
| product_code | String (unique) | e.g. 90-02 |
| name_th | String | Thai product name |
| name_en | String | English product name |
| category | String | Test category |
| shelf_life_days | Int | Used to auto-calc expiry |
| storage_condition | String | e.g. "Store 2–8°C" |
| qc_template_id | FK → QCTemplate | Default QC test list |
| is_active | Boolean | Soft-disable without delete |

### 5.2 Batch Number Generation

Format: `{PRODUCT_CODE}-{YYMMDD}-{SEQ}`
Example: `90-02-260620-001`

- Sequence is per product-per-day, zero-padded to 3 digits
- Generated atomically inside a DB transaction using `SELECT ... FOR UPDATE` on a BatchSequence counter row to prevent duplicates under concurrent inserts

### 5.3 Batch Report — Process Checklist

Stored as a JSONB array on the BatchReport row. The checklist template is pulled from the ProductMaster (via spec_template) so it can be customised per product without a schema migration.

### 5.4 QC Templates

Each product can have one active QC template. A template contains an ordered list of test items:

```
QCTemplate
  └── QCTemplateItem[]
        ├── test_item    (e.g. "Coliform Count")
        ├── specification (e.g. "< 10 CFU/g")
        ├── unit          (e.g. "CFU/g")
        └── order_index
```

When a QC Report is created, the current template items are **copied** into QCReportItem rows (snapshot), so future template changes do not retroactively alter historical reports.

### 5.5 QC Automatic Decision

```
overall_result = ALL(qc_report_items.pass_fail == PASS) ? PASS : FAIL
```

Computed server-side at report submission; stored as an enum field for query efficiency.

### 5.6 COA Number Generation

Format: `COA-{YYYYMMDD}-{SEQ}`
Example: `COA-20260620-001`

Sequence is per-day, same atomic generation pattern as batch numbers.

### 5.7 COA Public Verification

`GET /coa/[coa_number]` (public Next.js page, no auth required)

Displays only:
- Product name (EN)
- Batch number
- COA number
- Issue date
- Overall result (PASS / FAIL)

No internal QC item details are exposed. The page is rendered as a static-looking server component; no client-side data fetching that could be scripted.

---

## 6. Notification Architecture

### Interface Definition (pluggable)

```
interface NotificationService {
  batchSubmittedForQC(batch: Batch, qcOfficers: User[]): Promise<void>
  qcApproved(batch: Batch, managers: User[]): Promise<void>
  qcRejected(batch: Batch, operator: User, reason: string): Promise<void>
  managerApprovalNeeded(batch: Batch, managers: User[]): Promise<void>
  batchReleased(batch: Batch, stakeholders: User[]): Promise<void>
}
```

### Phase 1 Implementation: ConsoleNotificationService

Logs all events to stdout with structured JSON. No external dependency.

### Phase 2 Implementation: SmtpNotificationService

Wraps NodeMailer. Configured via env vars:
```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
```

Switch by changing one line in the DI composition root (`lib/notifications/index.ts`).

### Notification DB Table

All notifications are persisted regardless of delivery method, enabling an in-app notification bell and re-delivery if SMTP fails.

---

## 7. File Storage Architecture

### StorageAdapter Interface

```
interface StorageAdapter {
  put(key: string, buffer: Buffer, mimeType: string): Promise<string>  // returns URL
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getSignedUrl?(key: string, expiresInSeconds: number): Promise<string>
}
```

### Phase 1: LocalStorageAdapter

- Files stored under `/uploads/{year}/{month}/{uuid}.{ext}`
- Served via Next.js API route `/api/v1/uploads/[id]` with auth check
- Docker volume mounts `/uploads` directory for persistence

### Future: S3StorageAdapter

- Implement same interface using AWS SDK v3
- Swap in `lib/storage/index.ts` composition root
- `getSignedUrl` enables time-limited presigned download links

---

## 8. PDF Generation Architecture

### Approach: Server-Side React to PDF

Two libraries are evaluated:

| Library | Pros | Cons |
|---------|------|------|
| `@react-pdf/renderer` | No browser dependency, fast, pure JS | Limited CSS, custom layout required |
| Puppeteer | Full HTML/CSS fidelity, WYSIWYG | Heavy (~300 MB), slower |

**Decision for Phase 1:** `@react-pdf/renderer` for COA (structured layout).
Puppeteer held in reserve for batch/QC reports that may need complex formatting.

### PDF Templates

Each document type has a React component under `lib/pdf/templates/`:
- `BatchReportPDF.tsx`
- `QCReportPDF.tsx`
- `COAPDF.tsx`

Templates receive typed props (no raw DB objects), generated via a `buildCOAProps(coaId)` service function. This keeps templates testable without a DB.

### QR Code in COA

Generated server-side with `qrcode` npm package → PNG buffer embedded in the PDF as a base64 data URI. Links to `{APP_URL}/coa/{coa_number}`.

---

## 9. Electronic Signature Design

### Signature Record (stored as JSONB `signature_meta` column)

```json
{
  "version": 1,
  "method": "typed_name",
  "full_name": "สมชาย ใจดี",
  "user_id": "usr_abc123",
  "email": "somchai@uvholding.com",
  "timestamp_utc": "2026-06-20T10:30:00.000Z",
  "ip_address": "192.168.1.50",
  "user_agent": "Mozilla/5.0 ...",
  "session_id_hash": "sha256:..."
}
```

### Extensibility

The `method` field is an enum (`typed_name | drawn | pin`). Adding a drawn-signature or PIN method requires:
1. A new React signature capture component
2. A new case in the server-side signature validator
3. Additional fields in the same JSONB column (no schema migration needed)

The `version` field allows future parsing of legacy records if the structure evolves.

### Immutability

Once a signature is recorded, the `signed_at` timestamp is set and the API rejects any further PATCH to the signed fields. The AuditTrail captures the pre-sign and post-sign states.

---

## 10. Internationalisation (i18n)

### Strategy

- `next-intl` library manages locale routing and message files
- Locale prefix: `/th/...` (default, hidden) and `/en/...`
- Message files: `messages/th.json` and `messages/en.json`
- All UI labels, status names, and error messages are translated
- Product names store both `name_th` and `name_en`; displayed according to active locale
- Dates formatted with Thai Buddhist Era (BE) option for TH locale using `Intl.DateTimeFormat`
- Numbers formatted with Thai locale grouping/separators
- PDFs (COA, Reports) always render in **English** as the international standard; a Thai parallel COA is a future option

---
