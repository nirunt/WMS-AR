import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import Link from "next/link"

async function getBatch(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: {
      product: true,
      createdBy: { select: { fullName: true, email: true } },
      rawMaterials: true,
      batchReport: {
        include: {
          signedBy: { select: { fullName: true } },
        },
      },
      qcReport: {
        include: {
          qcOfficer: { select: { fullName: true } },
          items: {
            include: { templateItem: { select: { testName: true, unit: true } } },
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
  return batch
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const batch = await getBatch(id)
  if (!batch) notFound()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; กลับ
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{batch.batchNumber}</h1>
          <p className="text-gray-500">{batch.product.nameEn}</p>
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>ข้อมูลการผลิต</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: "สินค้า", value: `${batch.product.sku} — ${batch.product.nameEn}` },
                { label: "วันที่ผลิต", value: formatDate(batch.productionDate) },
                { label: "วันหมดอายุ", value: formatDate(batch.expiryDate) },
                { label: "จำนวน", value: `${batch.quantity} ${batch.quantityUnit}` },
                { label: "ผลิตโดย", value: batch.createdBy.fullName },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {batch.rawMaterials.length > 0 && (
          <Card>
            <CardHeader><CardTitle>วัตถุดิบ</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["รายการ", "ใบแจ้ง", "เลข Lot", "จำนวน", "วันหมดอายุ"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batch.rawMaterials.map((rm) => (
                    <tr key={rm.id}>
                      <td className="px-3 py-2 text-sm">{rm.materialName}</td>
                      <td className="px-3 py-2 text-sm font-mono text-xs">{rm.certificateNumber ?? "—"}</td>
                      <td className="px-3 py-2 text-sm font-mono text-xs">{rm.lotNumber ?? "—"}</td>
                      <td className="px-3 py-2 text-sm">{rm.quantity ? `${rm.quantity} ${rm.unit ?? ""}` : "—"}</td>
                      <td className="px-3 py-2 text-sm">{rm.expiryDate ? formatDate(rm.expiryDate) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {batch.batchReport && (
          <Card>
            <CardHeader><CardTitle>รายงานการผลิต</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">สถานะ</dt>
                  <dd className="text-sm font-medium">
                    {batch.batchReport.signatureMeta ? "ลงนามแล้ว" : "รอลงนาม"}
                  </dd>
                </div>
                {batch.batchReport.signedBy && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">ลงนามโดย</dt>
                    <dd className="text-sm">{batch.batchReport.signedBy.fullName}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {batch.qcReport && (
          <Card>
            <CardHeader><CardTitle>รายงาน QC</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">ผลโดยรวม</dt>
                  <dd className={`text-sm font-bold ${
                    batch.qcReport.overallResult === "PASS" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {batch.qcReport.overallResult ?? "—"}
                  </dd>
                </div>
                {batch.qcReport.qcOfficer && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">เจ้าหน้าที่ QC</dt>
                    <dd className="text-sm">{batch.qcReport.qcOfficer.fullName}</dd>
                  </div>
                )}
              </dl>
              {batch.qcReport.items.length > 0 && (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr>
                      {["รายการ", "ค่าที่วัด", "ผล"].map((h) => (
                        <th key={h} className="px-2 py-1 text-left text-xs text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batch.qcReport.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-1.5 text-xs">{item.templateItem.testName}</td>
                        <td className="px-2 py-1.5 text-xs">
                          {item.measuredValue != null ? `${item.measuredValue} ${item.templateItem.unit ?? ""}` : "—"}
                        </td>
                        <td className={`px-2 py-1.5 text-xs font-semibold ${
                          item.passFail === "PASS" ? "text-emerald-600" : item.passFail === "FAIL" ? "text-red-600" : "text-gray-400"
                        }`}>
                          {item.passFail ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {batch.coa && (
          <Card>
            <CardHeader><CardTitle>ใบรับรองคุณภาพ (COA)</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">เลข COA</dt>
                  <dd className="text-sm font-mono font-medium">
                    <Link href={`/coa/${batch.coa.coaNumber}`} className="text-[#003B73] hover:underline">
                      {batch.coa.coaNumber}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">วันออก</dt>
                  <dd className="text-sm">{formatDate(batch.coa.issueDate)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {batch.approvals.length > 0 && (
          <Card>
            <CardHeader><CardTitle>ประวัติการอนุมัติ</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {batch.approvals.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 text-sm">{a.approver.fullName}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={a.decision === "APPROVED" ? "text-emerald-600" : "text-red-600"}>
                          {a.decision === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{formatDate(a.createdAt)}</td>
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
