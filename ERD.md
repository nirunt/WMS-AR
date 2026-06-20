# Database Entity-Relationship Document
**U&V Holding LIMS-BMS**
Version 1.0 · 2026-06-20

---

## Entity Overview

```
User ──────────────────────────────────────────────────────────┐
  │                                                            │
  │ creates                                                    │ approves
  ▼                                                            │
Batch ────── RawMaterialEntry (many)                      Approval (many)
  │                                                            │
  ├──── BatchReport ────── ProcessChecklistItem (many)         │
  │          │                                                 │
  │          └──── Attachment (polymorphic)                    │
  │                                                            │
  ├──── QCReport ──────── QCReportItem (many)                  │
  │          │                                                 │
  │          └──── Attachment (polymorphic)                    │
  │                                                            │
  └──── COA ──────────────────────────────────────────────────-┘

ProductMaster ─── QCTemplate ─── QCTemplateItem (many)
     │
     └── (referenced by Batch, QCTemplate)

AuditTrail (polymorphic, references any entity)
Notification (per User)
BatchSequence (concurrency-safe counter)
COASequence   (concurrency-safe counter)
```

---

## Table Definitions

### `users`

```sql
users
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
email           VARCHAR(255)  UNIQUE NOT NULL
name            VARCHAR(255)  NOT NULL
password_hash   VARCHAR(255)  NOT NULL
role            ENUM('ADMIN','PRODUCTION','QC','MANAGER')  NOT NULL
department      VARCHAR(100)
is_active       BOOLEAN       NOT NULL DEFAULT true
last_login_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ   -- soft delete

INDEXES:
  idx_users_email        (email)
  idx_users_role         (role)
  idx_users_deleted_at   (deleted_at)  -- for filtering active users
```

---

### `product_master`

```sql
product_master
─────────────────────────────────────────────────────────────────
id                  UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
product_code        VARCHAR(20)   UNIQUE NOT NULL   -- e.g. "90-02"
name_th             VARCHAR(255)  NOT NULL
name_en             VARCHAR(255)  NOT NULL
category            VARCHAR(100)
shelf_life_days     INT           NOT NULL
storage_condition   VARCHAR(255)
spec_template       JSONB         -- process checklist template items
qc_template_id      UUID          REFERENCES qc_templates(id)
is_active           BOOLEAN       NOT NULL DEFAULT true
created_by          UUID          REFERENCES users(id)
created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
deleted_at          TIMESTAMPTZ

INDEXES:
  idx_product_code    (product_code)
  idx_product_active  (is_active) WHERE deleted_at IS NULL
```

---

### `qc_templates`

```sql
qc_templates
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
name            VARCHAR(255)  NOT NULL
product_id      UUID          REFERENCES product_master(id)
is_active       BOOLEAN       NOT NULL DEFAULT true
version         INT           NOT NULL DEFAULT 1
created_by      UUID          REFERENCES users(id)
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ

INDEXES:
  idx_qc_template_product  (product_id)
```

---

### `qc_template_items`

```sql
qc_template_items
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
template_id     UUID          NOT NULL REFERENCES qc_templates(id) ON DELETE CASCADE
test_item       VARCHAR(255)  NOT NULL
specification   VARCHAR(500)  NOT NULL
unit            VARCHAR(50)
order_index     INT           NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_qc_template_items_template  (template_id, order_index)
```

---

### `batches`

The central entity. Status enum drives the full workflow.

```sql
batches
─────────────────────────────────────────────────────────────────
id                  UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
batch_number        VARCHAR(50)   UNIQUE NOT NULL    -- 90-02-260620-001
product_id          UUID          NOT NULL REFERENCES product_master(id)
manufacturing_date  DATE          NOT NULL
expiry_date         DATE          NOT NULL            -- auto-calc from shelf_life_days
quantity_produced   DECIMAL(12,3) NOT NULL
quantity_unit       VARCHAR(20)   NOT NULL DEFAULT 'units'
operator_id         UUID          NOT NULL REFERENCES users(id)
status              ENUM(
                      'DRAFT',
                      'PRODUCTION_COMPLETE',
                      'QC_PENDING',
                      'QC_APPROVED',
                      'QC_REJECTED',
                      'PENDING_MANAGER_APPROVAL',
                      'RELEASED',
                      'REJECTED',
                      'ARCHIVED'
                    )             NOT NULL DEFAULT 'DRAFT'
production_notes    TEXT
revision_number     INT           NOT NULL DEFAULT 0   -- incremented on QC reject + resubmit
parent_batch_id     UUID          REFERENCES batches(id)  -- for revised batches
created_by          UUID          NOT NULL REFERENCES users(id)
created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
deleted_at          TIMESTAMPTZ

INDEXES:
  idx_batch_number          (batch_number)
  idx_batch_product         (product_id)
  idx_batch_status          (status) WHERE deleted_at IS NULL
  idx_batch_operator        (operator_id)
  idx_batch_manufacturing   (manufacturing_date)
  idx_batch_expiry          (expiry_date)
  idx_batch_created_at      (created_at DESC)
```

---

### `batch_sequences`

Provides concurrency-safe sequence numbers for batch number generation.

```sql
batch_sequences
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
product_id      UUID          NOT NULL REFERENCES product_master(id)
date_key        DATE          NOT NULL    -- the manufacturing date
last_seq        INT           NOT NULL DEFAULT 0

UNIQUE (product_id, date_key)

-- Usage: SELECT ... FOR UPDATE, then UPDATE last_seq = last_seq + 1
-- Returns zero-padded: LPAD(last_seq::text, 3, '0')
```

---

### `raw_material_entries`

```sql
raw_material_entries
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
batch_id        UUID          NOT NULL REFERENCES batches(id) ON DELETE CASCADE
material_name   VARCHAR(255)  NOT NULL
lot_number      VARCHAR(100)
supplier        VARCHAR(255)
quantity_used   DECIMAL(12,3) NOT NULL
unit            VARCHAR(20)   NOT NULL
notes           TEXT
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_rm_batch     (batch_id)
  idx_rm_lot       (lot_number)  -- for lot-based traceability searches
  idx_rm_material  (material_name)
```

---

### `batch_reports`

One-to-one with a batch (one report per batch, updated in place until signed).

```sql
batch_reports
─────────────────────────────────────────────────────────────────
id                  UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
batch_id            UUID          UNIQUE NOT NULL REFERENCES batches(id)
production_start    TIMESTAMPTZ
production_end      TIMESTAMPTZ
operator_id         UUID          NOT NULL REFERENCES users(id)
equipment_used      TEXT[]        -- array of equipment names/codes
process_checklist   JSONB         -- [{ item, is_checked, notes }]
deviation_report    TEXT
is_signed           BOOLEAN       NOT NULL DEFAULT false
signed_at           TIMESTAMPTZ
signature_meta      JSONB         -- see Electronic Signature design
created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_batch_report_batch  (batch_id)
```

---

### `qc_reports`

One-to-one with a batch. Items are a snapshot of the template at time of creation.

```sql
qc_reports
─────────────────────────────────────────────────────────────────
id                  UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
batch_id            UUID          UNIQUE NOT NULL REFERENCES batches(id)
qc_officer_id       UUID          NOT NULL REFERENCES users(id)
template_id         UUID          REFERENCES qc_templates(id)   -- reference only
template_version    INT           -- snapshot of version used
overall_result      ENUM('PASS','FAIL','PENDING')  NOT NULL DEFAULT 'PENDING'
rejection_reason    TEXT          -- populated on QC_REJECTED
submitted_at        TIMESTAMPTZ
is_signed           BOOLEAN       NOT NULL DEFAULT false
signed_at           TIMESTAMPTZ
signature_meta      JSONB
created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_qc_report_batch      (batch_id)
  idx_qc_report_officer    (qc_officer_id)
  idx_qc_report_result     (overall_result)
```

---

### `qc_report_items`

Snapshot of template items at the time the QC report was created.

```sql
qc_report_items
─────────────────────────────────────────────────────────────────
id                  UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
qc_report_id        UUID          NOT NULL REFERENCES qc_reports(id) ON DELETE CASCADE
template_item_id    UUID          REFERENCES qc_template_items(id)   -- origin ref only
test_item           VARCHAR(255)  NOT NULL    -- snapshot copy
specification       VARCHAR(500)  NOT NULL    -- snapshot copy
unit                VARCHAR(50)               -- snapshot copy
result              VARCHAR(500)              -- analyst fills this in
pass_fail           ENUM('PASS','FAIL','N/A') DEFAULT 'N/A'
comment             TEXT
order_index         INT           NOT NULL DEFAULT 0

INDEXES:
  idx_qc_items_report  (qc_report_id, order_index)
```

---

### `approvals`

Immutable event log of approval/rejection actions on a batch.

```sql
approvals
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
batch_id        UUID          NOT NULL REFERENCES batches(id)
approver_id     UUID          NOT NULL REFERENCES users(id)
role_at_time    ENUM('QC','MANAGER')  NOT NULL  -- role when action was taken
action          ENUM('APPROVE','REJECT')  NOT NULL
comment         TEXT
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_approval_batch     (batch_id)
  idx_approval_approver  (approver_id)
  idx_approval_created   (created_at DESC)

-- No UPDATE or DELETE on this table via application code
```

---

### `coas`

Certificate of Analysis records.

```sql
coas
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
coa_number      VARCHAR(50)   UNIQUE NOT NULL    -- COA-20260620-001
batch_id        UUID          UNIQUE NOT NULL REFERENCES batches(id)
qc_report_id    UUID          NOT NULL REFERENCES qc_reports(id)
issued_by       UUID          NOT NULL REFERENCES users(id)
issue_date      DATE          NOT NULL DEFAULT CURRENT_DATE
pdf_path        VARCHAR(500)  NOT NULL            -- storage key
qr_code_url     VARCHAR(500)  NOT NULL
is_revoked      BOOLEAN       NOT NULL DEFAULT false
revoke_reason   TEXT
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_coa_number   (coa_number)
  idx_coa_batch    (batch_id)
  idx_coa_date     (issue_date DESC)
```

---

### `coa_sequences`

```sql
coa_sequences
─────────────────────────────────────────────────────────────────
id          UUID  PRIMARY KEY  DEFAULT gen_random_uuid()
date_key    DATE  UNIQUE NOT NULL
last_seq    INT   NOT NULL DEFAULT 0
```

---

### `attachments`

Polymorphic file attachments (batch reports, QC reports, etc.).

```sql
attachments
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
entity_type     VARCHAR(50)   NOT NULL    -- 'batch_report' | 'qc_report' | 'coa'
entity_id       UUID          NOT NULL
file_name       VARCHAR(255)  NOT NULL    -- original file name
storage_key     VARCHAR(500)  NOT NULL    -- path / S3 key
file_size       INT           NOT NULL    -- bytes
mime_type       VARCHAR(100)  NOT NULL
uploaded_by     UUID          NOT NULL REFERENCES users(id)
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ               -- soft delete

INDEXES:
  idx_attachment_entity  (entity_type, entity_id) WHERE deleted_at IS NULL
  idx_attachment_uploader (uploaded_by)
```

---

### `audit_trail`

Immutable write-once log. Never updated or deleted by application code.

```sql
audit_trail
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
entity_type     VARCHAR(50)   NOT NULL    -- 'batch' | 'qc_report' | 'coa' | 'user' | ...
entity_id       UUID          NOT NULL
action          VARCHAR(100)  NOT NULL    -- 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'SIGN' | ...
user_id         UUID          REFERENCES users(id)
user_name       VARCHAR(255)              -- snapshot (user may be deleted later)
user_role       VARCHAR(50)               -- snapshot
old_values      JSONB
new_values      JSONB
changed_fields  TEXT[]                    -- list of field names that changed
ip_address      VARCHAR(45)               -- IPv4 or IPv6
user_agent      TEXT
session_id      VARCHAR(255)
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_audit_entity   (entity_type, entity_id, created_at DESC)
  idx_audit_user     (user_id, created_at DESC)
  idx_audit_action   (action)
  idx_audit_created  (created_at DESC)

-- Postgres ROW SECURITY POLICY: DENY UPDATE, DELETE to application role
-- Only INSERT allowed for application DB user on this table
```

---

### `notifications`

```sql
notifications
─────────────────────────────────────────────────────────────────
id              UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
user_id         UUID          NOT NULL REFERENCES users(id)
type            VARCHAR(100)  NOT NULL    -- 'BATCH_SUBMITTED_FOR_QC' | ...
title           VARCHAR(255)  NOT NULL
message         TEXT          NOT NULL
entity_type     VARCHAR(50)
entity_id       UUID
is_read         BOOLEAN       NOT NULL DEFAULT false
email_sent      BOOLEAN       NOT NULL DEFAULT false
email_sent_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()

INDEXES:
  idx_notif_user_unread  (user_id, is_read, created_at DESC)
```

---

## Relationships Summary

```
product_master 1──────────────────────────* batches
product_master 1──────────────────────────* qc_templates
qc_templates   1──────────────────────────* qc_template_items

batches        1──────────────────────────1 batch_reports
batches        1──────────────────────────1 qc_reports
batches        1──────────────────────────1 coas
batches        1──────────────────────────* raw_material_entries
batches        1──────────────────────────* approvals
batches        *──────────────────────────1 users (operator_id)
batches        *──────────────────────────1 users (created_by)

qc_reports     1──────────────────────────* qc_report_items
qc_template_items 1 (origin ref) ─────── * qc_report_items

batch_reports  (polymorphic) 1 ──────────* attachments
qc_reports     (polymorphic) 1 ──────────* attachments

users          1──────────────────────────* notifications
users          1──────────────────────────* approvals
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Avoids sequential ID enumeration attacks; supports future multi-tenant sharding |
| JSONB for signature_meta | Extensible without migration when new signature methods are added |
| JSONB for process_checklist | Per-product checklist templates vary; JSONB avoids EAV table complexity |
| Snapshot QC items | Decouples historical reports from template changes |
| Soft delete everywhere | Regulatory requirement to retain all records; audit trail compliance |
| Append-only audit_trail | Row-level security ensures immutability at DB level, not just app level |
| Separate sequence tables | Atomic batch/COA number generation without gaps under concurrency |
| `role_at_time` on approvals | Captures the approver's role at the moment of action for audit integrity |
