import { prisma } from "@/lib/prisma"
import { BatchStatus } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import Link from "next/link"

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todayBatches, qcPending, pendingManagerApproval, releasedThisMonth, rejectedThisMonth, totalQCThisMonth, passedQCThisMonth, recentCOAs] =
    await Promise.all([
      prisma.batch.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          deletedAt: null,
        },
      }),
      prisma.batch.count({
        where: { status: BatchStatus.QC_PENDING, deletedAt: null },
      }),
      prisma.batch.count({
        where: { status: BatchStatus.PENDING_MANAGER_APPROVAL, deletedAt: null },
      }),
      prisma.batch.count({
        where: { status: BatchStatus.RELEASED, releaseDate: { gte: startOfMonth }, deletedAt: null },
      }),
      prisma.batch.count({
        where: {
          status: { in: [BatchStatus.QC_REJECTED, BatchStatus.REJECTED] },
          updatedAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      prisma.qCReport.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      prisma.qCReport.count({
        where: { overallResult: "PASS", createdAt: { gte: startOfMonth }, deletedAt: null },
      }),
      prisma.cOA.findMany({
        where: { deletedAt: null },
        orderBy: { issueDate: "desc" },
        take: 5,
        include: { batch: { include: { product: true } } },
      }),
    ])

  const passRate = totalQCThisMonth > 0 ? Math.round((passedQCThisMonth / totalQCThisMonth) * 100) : null

  return {
    todayBatches,
    qcPending,
    pendingManagerApproval,
    releasedThisMonth,
    rejectedThisMonth,
    passRate,
    recentCOAs,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const kpis = [
    { label: "บันทึกวันนี้", value: data.todayBatches, color: "text-[#003B73]" },
    { label: "รอ QC ตรวจสอบ", value: data.qcPending, color: "text-amber-600" },
    { label: "รอผู้จัดการอนุมัติ", value: data.pendingManagerApproval, color: "text-purple-600" },
    { label: "อนุมัติเดือนนี้", value: data.releasedThisMonth, color: "text-emerald-600" },
    { label: "ปฏิเสธเดือนนี้", value: data.rejectedThisMonth, color: "text-red-600" },
    {
      label: "อัตราผ่าน QC",
      value: data.passRate !== null ? `${data.passRate}%` : "—",
      color: "text-[#00AEEF]",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>COA ล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["เลข COA", "สินค้า", "เลข Batch", "วันออก"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentCOAs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    ยังไม่มี COA
                  </td>
                </tr>
              ) : (
                data.recentCOAs.map((coa) => (
                  <tr key={coa.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">
                      <Link href={`/coa/${coa.coaNumber}`} className="text-[#003B73] hover:underline">
                        {coa.coaNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{coa.batch.product.nameEn}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{coa.batch.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(coa.issueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
