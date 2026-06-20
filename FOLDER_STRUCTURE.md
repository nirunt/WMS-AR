# Project Folder Structure
**U&V Holding LIMS-BMS**
Version 1.0 · 2026-06-20

---

```
wms-ar/
├── .env                         # Local dev env vars (gitignored)
├── .env.example                 # Template committed to repo
├── .eslintrc.json
├── .gitignore
├── docker-compose.yml           # App + PostgreSQL + Nginx
├── Dockerfile                   # Multi-stage production build
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma            # Full Prisma schema (all models)
│   ├── seed.ts                  # Seed: admin user, product master data
│   └── migrations/              # Generated migration files (committed)
│
├── messages/
│   ├── th.json                  # Thai UI strings (default language)
│   └── en.json                  # English UI strings
│
├── public/
│   ├── logo.png                 # U&V Holding logo (used in PDFs + UI)
│   ├── favicon.ico
│   └── fonts/                   # Self-hosted fonts (NotoSansThai, etc.)
│
├── uploads/                     # Local file storage (Docker volume)
│   └── .gitkeep
│
└── src/
    ├── app/                     # Next.js App Router
    │   │
    │   ├── layout.tsx           # Root layout (fonts, providers, i18n)
    │   ├── page.tsx             # Redirect → /dashboard
    │   │
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx     # Login form
    │   │
    │   ├── (app)/               # Authenticated layout group
    │   │   ├── layout.tsx       # Shell: sidebar nav + top bar
    │   │   │
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   │
    │   │   ├── products/
    │   │   │   ├── page.tsx     # Product list
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx # Create product
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx # Product detail / edit
    │   │   │       └── qc-template/
    │   │   │           └── page.tsx  # Manage QC template for product
    │   │   │
    │   │   ├── batches/
    │   │   │   ├── page.tsx     # Batch list (filterable, searchable)
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx # Create batch
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx          # Batch overview + status timeline
    │   │   │       ├── report/
    │   │   │       │   └── page.tsx      # Batch report form
    │   │   │       ├── raw-materials/
    │   │   │       │   └── page.tsx      # RM entry list
    │   │   │       ├── qc-report/
    │   │   │       │   └── page.tsx      # QC report form
    │   │   │       └── coa/
    │   │   │           └── page.tsx      # COA detail + generate PDF
    │   │   │
    │   │   ├── coas/
    │   │   │   └── page.tsx     # COA list / search
    │   │   │
    │   │   ├── audit-trail/
    │   │   │   └── page.tsx     # Admin-only audit log viewer
    │   │   │
    │   │   ├── search/
    │   │   │   └── page.tsx     # Global search results
    │   │   │
    │   │   ├── reports/
    │   │   │   └── page.tsx     # Report generation (monthly summaries, etc.)
    │   │   │
    │   │   └── settings/
    │   │       ├── users/
    │   │       │   └── page.tsx # User management (Admin only)
    │   │       └── profile/
    │   │           └── page.tsx # Current user profile / password change
    │   │
    │   ├── coa/
    │   │   └── [coa_number]/
    │   │       └── page.tsx     # PUBLIC COA verification page (no auth)
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts # NextAuth handler
    │       │
    │       └── v1/
    │           ├── products/
    │           │   ├── route.ts              # GET list, POST create
    │           │   └── [id]/
    │           │       └── route.ts          # GET, PATCH, DELETE
    │           │
    │           ├── batches/
    │           │   ├── route.ts              # GET list, POST create
    │           │   └── [id]/
    │           │       ├── route.ts          # GET detail, PATCH
    │           │       ├── submit/route.ts
    │           │       ├── qc-approve/route.ts
    │           │       ├── qc-reject/route.ts
    │           │       ├── approve/route.ts
    │           │       ├── reject/route.ts
    │           │       ├── archive/route.ts
    │           │       ├── report/
    │           │       │   ├── route.ts
    │           │       │   └── sign/route.ts
    │           │       ├── raw-materials/
    │           │       │   ├── route.ts
    │           │       │   └── [rmId]/route.ts
    │           │       └── qc-report/
    │           │           ├── route.ts
    │           │           └── sign/route.ts
    │           │
    │           ├── coas/
    │           │   ├── route.ts
    │           │   └── [coa_number]/
    │           │       ├── route.ts
    │           │       └── pdf/route.ts
    │           │
    │           ├── qc-templates/
    │           │   ├── route.ts
    │           │   └── [id]/
    │           │       ├── route.ts
    │           │       └── items/route.ts
    │           │
    │           ├── uploads/
    │           │   ├── route.ts              # POST: upload file
    │           │   └── [id]/route.ts         # GET: download file (auth)
    │           │
    │           ├── dashboard/route.ts
    │           ├── search/route.ts
    │           ├── audit-trail/route.ts
    │           └── verify/
    │               └── [coa_number]/route.ts # Public verification endpoint
    │
    ├── components/
    │   ├── ui/                  # shadcn/ui generated components (do not edit)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── form.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── badge.tsx
    │   │   └── ...
    │   │
    │   ├── layout/
    │   │   ├── Sidebar.tsx      # Left navigation sidebar
    │   │   ├── TopBar.tsx       # Header: breadcrumb, user menu, lang toggle
    │   │   ├── PageHeader.tsx   # Page title + action buttons
    │   │   └── NotificationBell.tsx
    │   │
    │   ├── batch/
    │   │   ├── BatchForm.tsx
    │   │   ├── BatchStatusBadge.tsx
    │   │   ├── BatchStatusTimeline.tsx
    │   │   ├── BatchTable.tsx
    │   │   ├── RawMaterialTable.tsx
    │   │   └── RawMaterialForm.tsx
    │   │
    │   ├── report/
    │   │   ├── BatchReportForm.tsx
    │   │   ├── ProcessChecklist.tsx
    │   │   ├── SignatureCapture.tsx  # Typed-name e-signature UI
    │   │   └── AttachmentUploader.tsx
    │   │
    │   ├── qc/
    │   │   ├── QCReportForm.tsx
    │   │   ├── QCResultBadge.tsx
    │   │   ├── QCItemRow.tsx
    │   │   └── QCTemplateEditor.tsx
    │   │
    │   ├── coa/
    │   │   ├── COACard.tsx
    │   │   └── COATable.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── KPICard.tsx
    │   │   ├── BatchStatusDonut.tsx
    │   │   ├── MonthlyTrendChart.tsx
    │   │   └── RecentCOAList.tsx
    │   │
    │   ├── product/
    │   │   ├── ProductForm.tsx
    │   │   └── ProductTable.tsx
    │   │
    │   └── shared/
    │       ├── DataTable.tsx        # Generic sortable/filterable table
    │       ├── SearchInput.tsx
    │       ├── DatePicker.tsx
    │       ├── StatusSelect.tsx
    │       ├── ConfirmDialog.tsx
    │       ├── EmptyState.tsx
    │       ├── LoadingSpinner.tsx
    │       └── PaginationBar.tsx
    │
    ├── lib/
    │   ├── prisma.ts            # PrismaClient singleton
    │   ├── auth.ts              # NextAuth config (authOptions)
    │   │
    │   ├── services/            # Business logic layer
    │   │   ├── batch.service.ts
    │   │   ├── qc-report.service.ts
    │   │   ├── coa.service.ts
    │   │   ├── product.service.ts
    │   │   ├── audit.service.ts
    │   │   └── sequence.service.ts   # Atomic seq number generation
    │   │
    │   ├── notifications/
    │   │   ├── index.ts              # Exports active NotificationService
    │   │   ├── notification.interface.ts
    │   │   ├── console.notification.ts   # Phase 1 stub
    │   │   └── smtp.notification.ts      # Phase 2 implementation
    │   │
    │   ├── storage/
    │   │   ├── index.ts              # Exports active StorageAdapter
    │   │   ├── storage.interface.ts
    │   │   ├── local.storage.ts      # Phase 1 local disk
    │   │   └── s3.storage.ts         # Future S3 implementation
    │   │
    │   ├── pdf/
    │   │   ├── generator.ts          # PDF generation orchestration
    │   │   └── templates/
    │   │       ├── COAPDF.tsx
    │   │       ├── BatchReportPDF.tsx
    │   │       └── QCReportPDF.tsx
    │   │
    │   ├── validators/          # Zod schemas (shared client + server)
    │   │   ├── batch.schema.ts
    │   │   ├── qc-report.schema.ts
    │   │   ├── product.schema.ts
    │   │   └── user.schema.ts
    │   │
    │   ├── middleware/
    │   │   ├── withAuth.ts      # API route auth wrapper
    │   │   └── withRole.ts      # API route RBAC wrapper
    │   │
    │   └── utils/
    │       ├── batch-number.ts  # Batch/COA number formatting
    │       ├── date.ts          # Date helpers, Buddhist Era formatting
    │       └── cn.ts            # Tailwind class merge utility
    │
    └── types/
        ├── next-auth.d.ts       # Session type augmentation
        ├── api.ts               # API request/response types
        └── domain.ts            # Domain model types (mirrors Prisma + extras)
```

---

## Docker Compose Layout

```yaml
# docker-compose.yml (overview)

services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    env_file: .env

  app:
    build: .
    depends_on: [postgres]
    volumes:
      - ./uploads:/app/uploads   # persistent file storage
    env_file: .env
    ports:
      - "3000:3000"

  nginx:                         # optional profile
    image: nginx:alpine
    profiles: ["production"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"

volumes:
  pgdata:
```

---

## Environment Variables (`.env.example`)

```bash
# Database
DATABASE_URL="postgresql://wmsuser:password@localhost:5432/wms_ar"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Application
APP_URL="http://localhost:3000"
NODE_ENV="development"

# File Storage
STORAGE_ADAPTER="local"          # 'local' | 's3'
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB="20"

# S3 (when STORAGE_ADAPTER=s3)
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_BUCKET=""

# Notifications
NOTIFICATION_ADAPTER="console"   # 'console' | 'smtp'

# SMTP (when NOTIFICATION_ADAPTER=smtp)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@uvholding.com"
```
