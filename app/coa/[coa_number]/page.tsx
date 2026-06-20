import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { PrintButton } from "@/components/shared/PrintButton"

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
                include: {
                  templateItem: { select: { testName: true, unit: true } },
                },
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
  const overallResult = coa.isRevoked
    ? "REVOKED"
    : (batch.qcReport?.overallResult ?? null)

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Print/download button */}
        <div className="flex justify-end mb-4 print:hidden">
          <PrintButton />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border print:border-gray-300">
          {/* Header */}
          <div className="bg-[#003B73] px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[#003B73] font-bold text-sm">UV</span>
              </div>
              <div>
                <p className="text-white/70 text-xs">
                  บริษัท ยูแอนด์วี โฮลดิ้ง (ไทยแลนด์) จำกัด
                </p>
                <p className="text-white font-semibold text-lg">
                  ใบรับรองคุณภาพ
                </p>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-1">Certificate of Analysis</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Revoked banner */}
            {coa.isRevoked && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                <p className="text-red-700 font-semibold text-lg">
                  ⚠️ ใบรับรองนี้ถูกยกเลิกแล้ว
                </p>
                {coa.revokedReason && (
                  <p className="text-red-600 text-sm mt-1">
                    เหตุผล: {coa.revokedReason}
                  </p>
                )}
              </div>
            )}

            {/* COA details grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "เลข COA", value: coa.coaNumber, mono: true },
                { label: "วันออก", value: formatDate(coa.issueDate) },
                { label: "ชื่อสินค้า", value: batch.product.nameEn },
                { label: "ชื่อสินค้า (ไทย)", value: batch.product.nameTh ?? "—" },
                { label: "เลข Batch", value: batch.batchNumber, mono: true },
                { label: "รหัสสินค้า", value: batch.product.sku, mono: true },
                { label: "วันที่ผลิต", value: formatDate(batch.productionDate) },
                { label: "วันหมดอายุ", value: formatDate(batch.expiryDate) },
                { label: "ผู้ออกใบรับรอง", value: coa.issuedBy.fullName },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p
                    className={`text-sm font-medium text-gray-900 ${
                      item.mono ? "font-mono" : ""
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* QC results table */}
            {batch.qcReport && batch.qcReport.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  ผลการทดสอบ
                </h3>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {["รายการทดสอบ", "ค่าที่วัด", "ผล"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batch.qcReport.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gray-700">
                          {item.templateItem.testName}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {item.measuredValue != null
                            ? `${item.measuredValue}${
                                item.templateItem.unit
                                  ? ` ${item.templateItem.unit}`
                                  : ""
                              }`
                            : (item.textResult ?? "—")}
                        </td>
                        <td
                          className={`px-3 py-2 font-semibold ${
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
              </div>
            )}

            {/* Overall result banner */}
            <div
              className={`rounded-xl p-5 text-center border-2 ${
                overallResult === "PASS"
                  ? "bg-emerald-50 border-emerald-300"
                  : overallResult === "FAIL"
                  ? "bg-red-50 border-red-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <p
                className={`text-3xl font-bold tracking-wide ${
                  overallResult === "PASS"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {overallResult ?? "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">ผลการตรวจสอบโดยรวม</p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center">
                เอกสารนี้ออกโดยระบบ LIMS และได้รับการลงนามอิเล็กทรอนิกส์แล้ว
                &mdash; COA เลข {coa.coaNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
