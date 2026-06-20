import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"

export default async function PublicCOAPage({
  params,
}: {
  params: Promise<{ coa_number: string }>
}) {
  const { coa_number } = await params

  const coa = await prisma.cOA.findUnique({
    where: { coaNumber: coa_number },
    include: {
      batch: {
        include: {
          product: true,
          qcReport: {
            include: {
              items: {
                include: { templateItem: { select: { testName: true, unit: true } } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      issuedBy: { select: { fullName: true } },
    },
  })

  if (!coa) notFound()

  const { batch } = coa

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#003B73] px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#003B73] font-bold text-sm">UV</span>
              </div>
              <div>
                <p className="text-white/80 text-xs">บริษัท ยูแอนด์วี โฮลดิ้ง (ไทยแลนด์) จำกัด</p>
                <p className="text-white font-semibold">ใบรับรองคุณภาพ</p>
              </div>
            </div>
            <p className="text-white/60 text-xs">Certificate of Analysis</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {coa.isRevoked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-semibold">ใบรับรองนี้ถูกยกเลิกแล้ว</p>
                {coa.revokedReason && (
                  <p className="text-red-600 text-sm mt-1">เหตุผล: {coa.revokedReason}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">เลข COA</p>
                <p className="font-mono font-semibold text-gray-900">{coa.coaNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">วันออก</p>
                <p className="text-gray-900">{formatDate(coa.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">สินค้า</p>
                <p className="text-gray-900">{batch.product.nameEn}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">สินค้า (ไทย)</p>
                <p className="text-gray-900">{batch.product.nameTh ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">เลข Batch</p>
                <p className="font-mono text-gray-900">{batch.batchNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">วันผลิต</p>
                <p className="text-gray-900">{formatDate(batch.productionDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">วันหมดอายุ</p>
                <p className="text-gray-900">{formatDate(batch.expiryDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ผู้ออกใบรับรอง</p>
                <p className="text-gray-900">{coa.issuedBy.fullName}</p>
              </div>
            </div>

            {batch.qcReport && batch.qcReport.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">ผลการทดสอบ</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500">รายการ</th>
                      <th className="text-left py-2 text-xs text-gray-500">ค่าที่วัด</th>
                      <th className="text-left py-2 text-xs text-gray-500">ผล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batch.qcReport.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 text-gray-700">{item.templateItem.testName}</td>
                        <td className="py-2 text-gray-700">
                          {item.measuredValue != null
                            ? `${item.measuredValue} ${item.templateItem.unit ?? ""}`.trim()
                            : item.textResult ?? "—"}
                        </td>
                        <td className={`py-2 font-semibold ${
                          item.passFail === "PASS" ? "text-emerald-600" : item.passFail === "FAIL" ? "text-red-600" : "text-gray-400"
                        }`}>
                          {item.passFail ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={`rounded-lg p-4 text-center border-2 ${
              coa.isRevoked
                ? "bg-red-50 border-red-300"
                : batch.qcReport?.overallResult === "PASS"
                ? "bg-emerald-50 border-emerald-300"
                : "bg-red-50 border-red-300"
            }`}>
              <p className={`text-2xl font-bold ${
                coa.isRevoked ? "text-red-600" : batch.qcReport?.overallResult === "PASS" ? "text-emerald-600" : "text-red-600"
              }`}>
                {coa.isRevoked ? "REVOKED" : (batch.qcReport?.overallResult ?? "—")}
              </p>
              <p className="text-xs text-gray-500 mt-1">ผลการตรวจสอบโดยรวม</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center">
                เอกสารนี้ออกโดยระบบ LIMS และได้รับการลงนามอิเล็กทรอนิกส์แล้ว{" "}
                — COA เลข {coa.coaNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
