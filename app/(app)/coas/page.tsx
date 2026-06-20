import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Card } from "@/components/shared/Card"
import Link from "next/link"

export default async function COAsPage() {
  const coas = await prisma.cOA.findMany({
    where: { deletedAt: null },
    orderBy: { issueDate: "desc" },
    take: 100,
    include: {
      batch: {
        include: {
          product: true,
          createdBy: { select: { fullName: true } },
        },
      },
      issuedBy: { select: { fullName: true } },
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">ใบรับรองคุณภาพ (COA)</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["เลข COA", "สินค้า", "เลข Batch", "ผู้ออก", "วันออก", "สถานะ"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    ยังไม่มีใบ COA
                  </td>
                </tr>
              ) : (
                coas.map((coa) => (
                  <tr key={coa.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">
                      <Link href={`/coa/${coa.coaNumber}`} className="text-[#003B73] hover:underline">
                        {coa.coaNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{coa.batch.product.nameEn}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{coa.batch.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{coa.issuedBy.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(coa.issueDate)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          coa.isRevoked
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {coa.isRevoked ? "ยกเลิก" : "ใช้งาน"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
