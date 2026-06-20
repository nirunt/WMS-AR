import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import { WorkflowActions } from "@/components/batch/WorkflowActions"
import { RawMaterialsManager } from "@/components/batch/RawMaterialsManager"
import { auth } from "@/lib/auth"
import { UserRole, BatchStatus } from "@/lib/db"
import Link from "next/link"

async function getBatch(id: string) {
  return prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: {
      product: true,
      createdBy: { select: { fullName: true, email: true } },
      rawMaterials: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      batchReport: {
        include: { signedBy: { select: { fullName: true } } },
      },
      qcReport: {
        include: {
          qcOfficer: { select: { fullName: true } },
          items: {
            include: {
              templateItem: { select: { testName: true, unit: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      coa: true,
      approvals: {
        include: { approver: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [batch, session] = await Promise.all([getBatch(id), auth()])
  if (!batch) notFound()

  const userRole = (session?.user?.role ?? UserRole.PRODUCTION) as UserRole
  const userId = session?.user?.id ?? ""

  const canEditRawMaterials =
    (batch.status === BatchStatus.DRAFT ||
      batch.status === BatchStatus.PRODUCTION_COMPLETE) &&
    (batch.createdById === userId || userRole === UserRole.ADMIN)

  const serializedMaterials = batch.rawMaterials.map((rm) => ({
    id: rm.id,
    materialName: rm.materialName,
    certificateNumber: rm.certificateNumber,
    lotNumber: rm.lotNumber,
    quantity: rm.quantity ? Number(rm.quantity) : null,
    unit: rm.unit,
    supplier: rm.supplier,
    expiryDate: rm.expiryDate ? rm.expiryDate.toISOString() : null,
  }))

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/batches"
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
          >
            &larr; กลับ
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {batch.batchNumber}
          </h1>
          <p className="text-gray-500">{batch.product.nameEn}</p>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <BatchStatusBadge status={batch.status} />
          <WorkflowActions
            batchId={id}
            status={batch.status}
            userRole={userRole}
            userId={userId}
            createdById={batch.createdById}
            hasBatchReport={!!batch.batchReport}
            batchReportSigned={!!batch.batchReport?.signatureMeta}
            hasQCReport={!!batch.qcReport}
            qcReportSigned={!!batch.qcReport?.signatureMeta}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Production info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการผลิต</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                {
                  label: "สินค้า",
                  value: `${batch.product.sku} — ${batch.product.nameEn}`,
                },
                { label: "วันที่ผลิต", value: formatDate(batch.productionDate) },
                { label: "วันหมดอายุ", value: formatDate(batch.expiryDate) },
                {
                  label: "จำนวน",
                  value: `${batch.quantity} ${batch.quantityUnit}`,
                },
                { label: "ผลิตโดย", value: batch.createdBy.fullName },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500 flex-shrink-0">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 text-right">
                    {value}
                  </dd>
                </div>
              ))}
              {batch.notes && (
                <div>
                  <dt className="text-sm text-gray-500 mb-1">หมายเหตุ</dt>
                  <dd className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {batch.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Raw materials */}
        <Card>
          <CardHeader>
            <CardTitle>วัตถุดิบ</CardTitle>
          </CardHeader>
          <CardContent>
            <RawMaterialsManager
              batchId={id}
              initialMaterials={serializedMaterials}
              readonly={!canEditRawMaterials}
            />
          </CardContent>
        </Card>

        {/* Batch report */}
        {batch.batchReport && (
          <Card>
            <CardHeader>
              <CardTitle>รายงานการผลิต</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">สถานะ</dt>
                  <dd className="text-sm font-medium">
                    {batch.batchReport.signatureMeta ? (
                      <span className="text-emerald-600">ลงนามแล้ว</span>
                    ) : (
                      <span className="text-amber-600">รอลงนาม</span>
                    )}
                  </dd>
                </div>
                {batch.batchReport.signedBy && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">ลงนามโดย</dt>
                    <dd className="text-sm">{batch.batchReport.signedBy.fullName}</dd>
                  </div>
                )}
                {batch.batchReport.productionNotes && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">หมายเหตุการผลิต</dt>
                    <dd className="text-sm text-gray-700 bg-gray-50 rounded p-2 text-xs">
                      {batch.batchReport.productionNotes}
                    </dd>
                  </div>
                )}
              </dl>
              {!batch.batchReport.signatureMeta &&
                (userRole === UserRole.PRODUCTION ||
                  userRole === UserRole.ADMIN) && (
                  <Link
                    href={`/batches/${id}/report`}
                    className="inline-block mt-3 text-sm text-[#003B73] hover:underline"
                  >
                    แก้ไขรายงาน &rarr;
                  </Link>
                )}
            </CardContent>
          </Card>
        )}

        {/* QC report */}
        {batch.qcReport && (
          <Card>
            <CardHeader>
              <CardTitle>รายงาน QC</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">ผลโดยรวม</dt>
                  <dd
                    className={`text-sm font-bold ${
                      batch.qcReport.overallResult === "PASS"
                        ? "text-emerald-600"
                        : batch.qcReport.overallResult === "FAIL"
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {batch.qcReport.overallResult ?? "กำลังดำเนินการ"}
                  </dd>
                </div>
                {batch.qcReport.qcOfficer && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">เจ้าหน้าที่ QC</dt>
                    <dd className="text-sm">
                      {batch.qcReport.qcOfficer.fullName}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">สถานะ</dt>
                  <dd className="text-sm">
                    {batch.qcReport.signatureMeta ? (
                      <span className="text-emerald-600">ลงนามแล้ว</span>
                    ) : (
                      <span className="text-amber-600">กำลังดำเนินการ</span>
                    )}
                  </dd>
                </div>
              </dl>
              {batch.qcReport.items.length > 0 && (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr>
                      {["รายการ", "ค่าที่วัด", "ผล"].map((h) => (
                        <th
                          key={h}
                          className="px-2 py-1 text-left text-xs text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batch.qcReport.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-1.5 text-xs">
                          {item.templateItem.testName}
                        </td>
                        <td className="px-2 py-1.5 text-xs">
                          {item.measuredValue != null
                            ? `${item.measuredValue}${
                                item.templateItem.unit
                                  ? ` ${item.templateItem.unit}`
                                  : ""
                              }`
                            : (item.textResult ?? "—")}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-xs font-semibold ${
                            item.passFail === "PASS"
                              ? "text-emerald-600"
                              : item.passFail === "FAIL"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {item.passFail ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!batch.qcReport.signatureMeta &&
                (userRole === UserRole.QC || userRole === UserRole.ADMIN) && (
                  <Link
                    href={`/batches/${id}/qc-report`}
                    className="inline-block mt-3 text-sm text-[#003B73] hover:underline"
                  >
                    แก้ไขรายงาน QC &rarr;
                  </Link>
                )}
            </CardContent>
          </Card>
        )}

        {/* COA */}
        {batch.coa && (
          <Card>
            <CardHeader>
              <CardTitle>ใบรับรองคุณภาพ (COA)</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">เลข COA</dt>
                  <dd className="text-sm font-mono font-medium">
                    <Link
                      href={`/coa/${batch.coa.coaNumber}`}
                      className="text-[#003B73] hover:underline"
                    >
                      {batch.coa.coaNumber}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">วันออก</dt>
                  <dd className="text-sm">{formatDate(batch.coa.issueDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">สถานะ</dt>
                  <dd
                    className={`text-sm font-medium ${
                      batch.coa.isRevoked ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {batch.coa.isRevoked ? "ยกเลิกแล้ว" : "ใช้งาน"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Approval history */}
        {batch.approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {batch.approvals.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5 text-sm">
                        {a.approver.fullName}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">
                        {a.stage}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-sm font-medium ${
                            a.decision === "APPROVED"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {a.decision === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}
                        </span>
                        {a.comment && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {a.comment}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {formatDate(a.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
