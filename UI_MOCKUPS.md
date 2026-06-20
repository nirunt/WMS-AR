# UI Mockup Descriptions — Text Wireframes
**U&V Holding LIMS-BMS**
Version 1.0 · 2026-06-20

Design language: clean ERP/LIMS aesthetic. White background, navy primary
(`#003B73`), sky-blue accent (`#00AEEF`). Compact density with clear visual
hierarchy. Sans-serif font (Inter / Noto Sans Thai for bilingual support).

---

## 1. Application Shell (Authenticated Layout)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                     │
│ ┌──────┐  Home > Batches > 90-02-260620-001          🔔 3  [TH|EN]  👤▾  │
│ │ LOGO │  (breadcrumb)                    (notification) (lang) (user menu)│
│ └──────┘                                                                   │
├──────────┬─────────────────────────────────────────────────────────────────┤
│          │                                                                  │
│ SIDEBAR  │  PAGE CONTENT AREA                                               │
│ ─────────│                                                                  │
│ 📊 Dashboard                                                                │
│ ─────────│                                                                  │
│ 📦 Batches                                                                  │
│ ─────────│                                                                  │
│ 🧪 QC Reports  ← highlighted when active                                   │
│ ─────────│                                                                  │
│ 📄 COAs  │                                                                  │
│ ─────────│                                                                  │
│ 🗂 Products                                                                 │
│ ─────────│                                                                  │
│ 🔍 Search│                                                                  │
│ ─────────│                                                                  │
│ ── Admin ──                                                                 │
│ 👥 Users │                                                                  │
│ 📋 Audit │                                                                  │
│          │                                                                  │
│          │                                                                  │
│ v1.0.0   │                                                                  │
└──────────┴─────────────────────────────────────────────────────────────────┘

Sidebar: 240px wide, navy background (#003B73), white icons+text.
Active item: sky-blue left border + slightly lighter navy background.
Sidebar collapses to icon-only (64px) on screen < 1280px.
```

---

## 2. Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                     [ส.ค. 2026 ▾]  [Export]  │
├─────────────────────────────────────────────────────────────────────────┤
│  KPI CARDS ROW                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 🏭 วันนี้    │ │ 🔬 รอ QC    │ │ ✅ รออนุมัติ │ │ 📦 ปล่อย    │  │
│  │ ผลิตแล้ว    │ │              │ │ ผู้จัดการ    │ │ แล้ว        │  │
│  │     12       │ │      5       │ │      3        │ │     87       │  │
│  │ Batches      │ │ [!] urgent   │ │ [!] urgent   │ │ this month   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ ❌ Rejected  │ │ 📄 COA ล่าสุด│ │ ✅ QC ผ่าน  │ │              │  │
│  │              │ │ ออกแล้ว     │ │ เดือนนี้    │ │              │  │
│  │      2       │ │     23       │ │   94.2%      │ │              │  │
│  │ this month   │ │ this month   │ │              │ │              │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ MONTHLY PRODUCTION TREND        │  │ QC PASS / FAIL RATE         │  │
│  │                                 │  │                             │  │
│  │ 30 │        ████               │  │ 100% │████████████          │  │
│  │ 20 │   ████ ████ ████          │  │  80% │                      │  │
│  │ 10 │████████████ ████ ████    │  │  60% │                      │  │
│  │  0 └──────────────────────── │  │     Mar Apr May Jun Jul Aug │  │
│  │    Mar Apr May Jun Jul Aug   │  │  ■ Pass  ■ Fail             │  │
│  │  ■ 90-01 ■ 90-02 ■ 90-03+   │  │                             │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                          │
│  RECENT COAs                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ COA Number        Product         Batch           Date    Result │   │
│  │ COA-20260620-023  90-02 SI-2      90-02-260620-003  20/06  PASS │   │
│  │ COA-20260619-022  90-04 Formalin  90-04-260619-001  19/06  PASS │   │
│  │ COA-20260618-021  90-01 Swab      90-01-260618-002  18/06  PASS │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

KPI cards: white background, subtle shadow, colored top border.
Urgent badges (pending QC, pending approval): amber/orange with count chip.
Charts: Recharts responsive containers, navy + sky-blue palette.
```

---

## 3. Batch List Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Batches (Production Batch Records)               [+ สร้าง Batch ใหม่]  │
├─────────────────────────────────────────────────────────────────────────┤
│ FILTERS ROW                                                              │
│ [🔍 ค้นหา batch number...] [Product ▾] [Status ▾] [Date From] [To]    │
│                                              [Clear Filters]  [Export]  │
├──────────┬─────────────────┬──────────┬───────────┬────────┬────────────┤
│ Batch No.│ Product         │ Mfg Date │ Exp Date  │ Qty    │ Status     │
├──────────┼─────────────────┼──────────┼───────────┼────────┼────────────┤
│ 90-02-   │ SI-2 Coliform   │ 20/06/26 │ 20/06/27  │ 500 u  │ ● RELEASED│
│ 260620-  │ Screening Test  │          │           │        │            │
│ 003      │                 │          │           │        │            │
├──────────┼─────────────────┼──────────┼───────────┼────────┼────────────┤
│ 90-01-   │ Swab Test       │ 20/06/26 │ 20/12/26  │ 1000 u │ ● QC PEND │
│ 260620-  │                 │          │           │        │ [! action] │
│ 002      │                 │          │           │        │            │
├──────────┼─────────────────┼──────────┼───────────┼────────┼────────────┤
│ 90-03-   │ MJPK Pesticide  │ 19/06/26 │ 19/06/27  │ 200 u  │ ● DRAFT   │
│ 260619-  │ Test            │          │           │        │            │
│ 001      │                 │          │           │        │            │
├──────────┴─────────────────┴──────────┴───────────┴────────┴────────────┤
│ Showing 1–20 of 143      [< Prev]  [1] [2] [3] ... [8]  [Next >]       │
└─────────────────────────────────────────────────────────────────────────┘

Status badge colors:
  DRAFT                 = gray
  PRODUCTION_COMPLETE   = blue
  QC_PENDING            = amber  + action needed icon for QC role
  QC_APPROVED           = teal
  QC_REJECTED           = red
  PENDING_MANAGER_APPROVAL = amber + action needed icon for Manager role
  RELEASED              = green
  REJECTED              = red
  ARCHIVED              = gray (muted)

Row click → Batch Detail page.
```

---

## 4. Batch Detail Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Batches  /  90-02-260620-003                                           │
│                                                                          │
│ SI-2 Coliform Screening Test                    ● QC_PENDING            │
├─────────────────────────────────────────────────────────────────────────┤
│ STATUS TIMELINE                                                          │
│                                                                          │
│  ✅ Draft ──── ✅ Production Complete ──── 🟡 QC Pending ──── ○ ──── ○  │
│  20/06 10:00    20/06 14:30                 20/06 15:00    pending     │
│                                                                          │
├───────────────────────────────┬─────────────────────────────────────────┤
│ BATCH INFORMATION             │ ACTIONS PANEL                           │
│ ─────────────────────────────│ ─────────────────────────────────────── │
│ Batch Number   90-02-260620-003│ [Role: QC]                              │
│ Product Code   90-02           │                                         │
│ Mfg Date       20 มิ.ย. 2026  │ [✅ QC Approve]  [❌ QC Reject]        │
│ Exp Date       20 มิ.ย. 2027  │                                         │
│ Quantity       500 units        │ ────────────────────────────────────── │
│ Operator       สมชาย ใจดี     │ Batch Report Status                    │
│ Created By     สมชาย ใจดี     │ ✅ Signed (20/06 14:25)               │
│ Created At     20/06 10:00      │                                         │
│ Revision       #0               │ QC Report Status                       │
│                                 │ ⚠ Not yet started → [Start QC Report] │
│ Production Notes:               │                                         │
│ Normal production run.          │                                         │
│                                 │                                         │
└───────────────────────────────┴─────────────────────────────────────────┘
│                                                                          │
│  TABS                                                                    │
│  [Raw Materials] [Batch Report] [QC Report] [COA] [Audit History]       │
│                                                                          │
│  ─── Raw Materials Tab ─────────────────────────────────────────────── │
│  [+ Add Material]                                                        │
│  ┌──────────────────┬────────────┬──────────┬──────┬──────┬──────────┐  │
│  │ Material Name    │ Lot Number │ Supplier │ Qty  │ Unit │          │  │
│  ├──────────────────┼────────────┼──────────┼──────┼──────┼──────────┤  │
│  │ Chromogenic Agar │ LA-2024-55 │ Merck    │ 50   │ g    │ [✏] [🗑]│  │
│  │ Buffer Solution  │ BF-2024-12 │ Sigma    │ 100  │ ml   │ [✏] [🗑]│  │
│  └──────────────────┴────────────┴──────────┴──────┴──────┴──────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Batch Report Form

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Batch Report — 90-02-260620-003                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ PRODUCTION TIMES                                                         │
│ Production Start  [20/06/2026  10:00]     Production End [14:30]        │
│                                                                          │
│ EQUIPMENT USED                                                           │
│ [Autoclave A1          ×] [Balance Scale B2  ×] [+ Add Equipment]       │
│                                                                          │
│ PROCESS CHECKLIST                                                        │
│ ┌───┬─────────────────────────────────────────────────┬───────────────┐  │
│ │ ✅│ 1. Verify raw material lots against BOM         │ Notes...      │  │
│ │ ✅│ 2. Clean room temperature ≤ 25°C checked        │               │  │
│ │ ✅│ 3. pH calibration completed                     │               │  │
│ │ ☐ │ 4. Autoclave cycle log attached                 │               │  │
│ │ ✅│ 5. Packaging integrity visual check             │               │  │
│ └───┴─────────────────────────────────────────────────┴───────────────┘  │
│                                                                          │
│ DEVIATION REPORT                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │ (none)                                                              │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ATTACHMENTS                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │ 📎 Drop files here or click to upload (max 20MB each)               │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│ 📷 batch_photo_01.jpg (2.1 MB)  [Preview] [Remove]                      │
│ 📄 autoclave_log.pdf (0.3 MB)   [Preview] [Remove]                      │
│                                                                          │
│                              [Save Draft]  [Sign & Complete Report]     │
│                                                                          │
│ ─── SIGNATURE DIALOG (on button click) ───────────────────────────────  │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │ Electronic Signature Confirmation                              [×]  │  │
│ │                                                                     │  │
│ │ By signing, you confirm that this batch report is accurate         │  │
│ │ and complete.                                                       │  │
│ │                                                                     │  │
│ │ Full Name (กรุณาพิมพ์ชื่อ-นามสกุลเต็ม):                         │  │
│ │ [                                          ]                        │  │
│ │                                                                     │  │
│ │ Signed as: สมชาย ใจดี (somchai@uvholding.com)                    │  │
│ │ Timestamp: 20/06/2026 14:25:33 UTC+7                               │  │
│ │ IP Address: 192.168.1.50                                           │  │
│ │                                                                     │  │
│ │            [Cancel]          [Confirm Signature]                   │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. QC Report Form

```
┌─────────────────────────────────────────────────────────────────────────┐
│ QC Report — 90-02-260620-003 (SI-2 Coliform Screening Test)             │
│ Template: SI-2 Standard QC v3  (snapshot)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ QC Officer: นภา สุขสันต์                   Date: 20/06/2026            │
│                                                                          │
│ TEST RESULTS TABLE                                                       │
│ ┌────┬───────────────────────┬────────────────┬──────────┬──────┬──────┐ │
│ │ #  │ Test Item             │ Specification  │ Result   │ Unit │ P/F  │ │
│ ├────┼───────────────────────┼────────────────┼──────────┼──────┼──────┤ │
│ │ 1  │ Coliform Count        │ < 10 CFU/g     │ [< 10  ] │CFU/g │[PASS]│ │
│ │ 2  │ Colour               │ Purple/violet  │ [Purple] │  —   │[PASS]│ │
│ │ 3  │ pH (25°C)            │ 7.0 – 7.4      │ [ 7.2  ] │  —   │[PASS]│ │
│ │ 4  │ Clarity              │ Clear, no PPT  │ [Clear ] │  —   │[PASS]│ │
│ │ 5  │ Volume per vial      │ 5.0 ± 0.1 ml   │ [ 5.0  ] │ ml   │[PASS]│ │
│ │ 6  │ Label integrity      │ Pass           │ [Pass  ] │  —   │[PASS]│ │
│ └────┴───────────────────────┴────────────────┴──────────┴──────┴──────┘ │
│                                                                          │
│ OVERALL RESULT: ✅ PASS  (auto-computed — all items passed)             │
│                                                                          │
│ Notes / Comments:                                                        │
│ [All parameters within specification. Batch approved for release.]      │
│                                                                          │
│                         [Save Draft]  [Sign & Submit QC Report]         │
│                                                                          │
│ After signing, QC Approve / QC Reject buttons appear in the batch       │
│ Actions Panel.                                                           │
└─────────────────────────────────────────────────────────────────────────┘

Pass/Fail dropdown per row: green PASS / red FAIL / gray N/A.
Auto-compute: when any row changes to FAIL, overall result turns red FAIL instantly.
```

---

## 7. COA Detail & Generation Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Certificate of Analysis — 90-02-260620-003                              │
├─────────────────────────────────────────────────────────────────────────┤
│  [Manager view — batch is RELEASED]                                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ⚠ COA not yet generated for this batch.                          │ │
│  │                          [Generate COA]                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ─── After generation ──────────────────────────────────────────────── │
│                                                                          │
│  COA Number    COA-20260620-023                                         │
│  Issue Date    20 มิ.ย. 2569 (20/06/2026)                              │
│  Issued By     นภา สุขสันต์                                            │
│  Product       90-02 SI-2 Coliform Screening Test                      │
│  Batch         90-02-260620-003                                         │
│  Mfg Date      20/06/2026                                               │
│  Exp Date      20/06/2027                                               │
│  Result        ✅ PASS                                                  │
│                                                                          │
│  [📄 Download PDF]   [🔗 Copy Verification Link]                       │
│                                                                          │
│  QR Code:  ┌─────┐                                                      │
│            │▓▓▓▓▓│  Scan to verify at:                                  │
│            │▓   ▓│  https://lims.uvholding.com/coa/COA-20260620-023    │
│            │▓▓▓▓▓│                                                      │
│            └─────┘                                                      │
│                                                                          │
│  [Admin only: Revoke COA]                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. COA PDF Layout (print/download view)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                               [LOGO]    │
│           U&V HOLDING (THAILAND) CO., LTD.                              │
│           บริษัท ยู แอนด์ วี โฮลดิ้ง (ประเทศไทย) จำกัด               │
│                                                                          │
│                 CERTIFICATE OF ANALYSIS                                  │
│                                                                          │
│  COA Number    : COA-20260620-023                                       │
│  Issue Date    : June 20, 2026                                          │
│                                                                          │
│  Product Name  : SI-2 Coliform Screening Test                           │
│  Product Code  : 90-02                                                  │
│  Batch Number  : 90-02-260620-003                                       │
│  Mfg Date      : June 20, 2026                                          │
│  Expiry Date   : June 20, 2027                                          │
│  Quantity      : 500 units                                              │
│  Storage       : Store at 2–8°C, avoid direct sunlight                 │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────── │
│  TEST RESULTS                                                            │
│  ┌──────────────────────┬────────────────┬──────────┬──────┬────────┐  │
│  │ Test Item            │ Specification  │ Result   │ Unit │ Result │  │
│  ├──────────────────────┼────────────────┼──────────┼──────┼────────┤  │
│  │ Coliform Count       │ < 10 CFU/g     │ < 10     │CFU/g │ PASS   │  │
│  │ Colour               │ Purple/violet  │ Purple   │  —   │ PASS   │  │
│  │ pH (25°C)            │ 7.0 – 7.4      │ 7.2      │  —   │ PASS   │  │
│  │ Clarity              │ Clear, no PPT  │ Clear    │  —   │ PASS   │  │
│  │ Volume per vial      │ 5.0 ± 0.1 ml   │ 5.0      │ ml   │ PASS   │  │
│  │ Label integrity      │ Pass           │ Pass     │  —   │ PASS   │  │
│  └──────────────────────┴────────────────┴──────────┴──────┴────────┘  │
│                                                                          │
│  OVERALL RESULT:  ██ PASS ██                                            │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Authorized By:  ___________________________      ┌───────────────┐    │
│  Name:           นภา สุขสันต์ (QC Manager)       │   QR Code    │    │
│  Date:           June 20, 2026                     │   Scan to    │    │
│                                                    │   verify     │    │
│  Company Stamp:  [stamp area]                      └───────────────┘    │
│                                                                          │
│  This certificate is issued for the above batch only. For verification  │
│  scan the QR code or visit: https://lims.uvholding.com/coa/...         │
└─────────────────────────────────────────────────────────────────────────┘
A4 landscape or portrait (configurable). Navy header bar, company logo top-right.
Footer: page number + confidentiality notice.
```

---

## 9. Public COA Verification Page (`/coa/COA-20260620-023`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    [U&V HOLDING LOGO]                                   │
│              U&V HOLDING (THAILAND) CO., LTD.                           │
│                 COA Verification System                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              ✅ Certificate Verified                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  COA Number    COA-20260620-023                                 │   │
│  │  Product       SI-2 Coliform Screening Test (90-02)            │   │
│  │  Batch Number  90-02-260620-003                                 │   │
│  │  Issue Date    June 20, 2026                                    │   │
│  │                                                                 │   │
│  │  Overall Result:                                                │   │
│  │                                                                 │   │
│  │         ██████████ PASS ██████████                             │   │
│  │              (large green indicator)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  This certificate was issued by U&V Holding (Thailand) Co., Ltd.       │
│  For enquiries contact: quality@uvholding.com                           │
│                                                                          │
│  [TH | EN]  (language toggle, no nav otherwise)                        │
│                                                                          │
│  If this product was not manufactured by U&V Holding, please report    │
│  to quality@uvholding.com                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

No internal QC details. Mobile-first responsive layout (QR scan target).
Invalid/revoked COA shows a red "Certificate Not Found or Revoked" panel.
```

---

## 10. Audit Trail Viewer (Admin Only)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Audit Trail                                              [Export CSV]   │
├─────────────────────────────────────────────────────────────────────────┤
│ FILTERS                                                                  │
│ [Entity Type ▾] [User ▾] [Action ▾] [Date From] [Date To] [Search]    │
├──────────┬────────────────┬───────────┬──────────┬───────┬─────────────┤
│ Time     │ User           │ Entity    │ Action   │ IP    │             │
├──────────┼────────────────┼───────────┼──────────┼───────┼─────────────┤
│ 15:02:01 │ นภา สุขสันต์  │ Batch     │ STATUS_  │192.168│ [▶ Details] │
│ 20/06    │ (QC)           │ 90-02-003 │ CHANGE   │.1.51  │            │
├──────────┼────────────────┼───────────┼──────────┼───────┼─────────────┤
│ 14:25:33 │ สมชาย ใจดี    │ Batch     │ SIGN     │192.168│ [▶ Details] │
│ 20/06    │ (Production)   │ Report    │          │.1.50  │            │
├──────────┼────────────────┼───────────┼──────────┼───────┼─────────────┤
│ 10:05:12 │ สมชาย ใจดี    │ Batch     │ CREATE   │192.168│ [▶ Details] │
│ 20/06    │ (Production)   │ 90-02-003 │          │.1.50  │            │
└──────────┴────────────────┴───────────┴──────────┴───────┴─────────────┘

▶ Details expanded:
  ┌────────────────────────────────────────────────────────────────┐
  │ Old Values:  { "status": "QC_PENDING" }                       │
  │ New Values:  { "status": "QC_APPROVED" }                      │
  │ Changed:     status                                            │
  └────────────────────────────────────────────────────────────────┘
```

---

## 11. Product Master — Create/Edit Form

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Create Product Master                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ BASIC INFORMATION                                                        │
│                                                                          │
│ Product Code *         [90-02              ]   (unique, e.g. 90-02)     │
│ Product Name (TH) *    [SI-2 โคลิฟอร์ม สกรีนนิ่ง เทสต์            ]   │
│ Product Name (EN) *    [SI-2 Coliform Screening Test                ]   │
│ Category               [Microbiology       ▾]                           │
│                                                                          │
│ SHELF LIFE & STORAGE                                                     │
│                                                                          │
│ Shelf Life (days) *    [365     ]                                        │
│ Storage Condition *    [Store at 2–8°C, avoid direct sunlight      ]    │
│                                                                          │
│ QC TEMPLATE                                                              │
│                                                                          │
│ QC Template            [SI-2 Standard QC v3                       ▾]   │
│                         [+ Create New Template]  [Edit Selected Template]│
│                                                                          │
│ PROCESS CHECKLIST TEMPLATE (for Batch Report)                           │
│ [+ Add Checklist Item]                                                   │
│ 1. [Verify raw material lots against BOM                          ] [🗑]│
│ 2. [Clean room temperature ≤ 25°C checked                         ] [🗑]│
│ 3. [pH calibration completed                                      ] [🗑]│
│    (drag to reorder)                                                    │
│                                                                          │
│ Active     ● Yes                                                         │
│                                                                          │
│                                    [Cancel]  [Save Product Master]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Global Search Results Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search results for "260620"                     (24 results, 0.08s)  │
├─────────────────────────────────────────────────────────────────────────┤
│ BATCHES (12)                                               [View all]   │
│  90-02-260620-003  SI-2 Coliform        RELEASED      20/06/26         │
│  90-01-260620-002  Swab Test            QC_PENDING    20/06/26         │
│  90-03-260620-001  MJPK Pesticide       DRAFT         19/06/26         │
│  ...                                                                     │
│                                                                          │
│ COAs (8)                                                   [View all]   │
│  COA-20260620-023  SI-2 Coliform        90-02-260620-003  PASS  20/06  │
│  COA-20260620-022  Swab Test            90-01-260620-001  PASS  20/06  │
│  ...                                                                     │
│                                                                          │
│ RAW MATERIALS (4)                                          [View all]   │
│  Lot: LA-260620-55  Chromogenic Agar   → Batch 90-02-260620-003        │
│  ...                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Design Token Summary

```
Colors
  Primary       #003B73   (navy)    — sidebar bg, primary buttons, headings
  Secondary     #00AEEF   (sky)     — active states, links, chart accent
  Success       #16A34A   (green)   — PASS, RELEASED, approved states
  Warning       #D97706   (amber)   — QC_PENDING, action-needed badges
  Danger        #DC2626   (red)     — FAIL, REJECTED, error states
  Background    #FFFFFF             — page background
  Surface       #F8FAFC             — card / table row background
  Border        #E2E8F0             — subtle dividers

Typography
  Font family: Inter (Latin), Noto Sans Thai (Thai)
  Base size: 14px
  Heading scale: 24/20/18/16/14
  Table row height: 52px

Spacing
  Base unit: 4px (Tailwind default)
  Page padding: 24px
  Card padding: 20px
  Form field gap: 16px

Border radius
  Card: 8px
  Button: 6px
  Badge: 9999px (pill)
  Input: 4px
```
