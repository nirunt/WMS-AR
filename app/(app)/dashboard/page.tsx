import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import { BatchStatusChart } from "@/components/dashboard/BatchStatusChart"
import { BatchTrendChart } from "@/components/dashboard/BatchTrendChart"
import { ProductBatchChart } from "@/components/dashboard/ProductBatchChart"
import { formatDate } from "@/lib/utils"
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Award,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

async function getDashboardData(userId: string, role: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    todayBatches,
    qcPending,
    pendingManagerApproval,
    releasedThisMonth,
    rejectedThisMonth,
    recentCOAs,
    passCount,
    failCount,
    statusGroups,
    batchesLast30,
    productGroups,
  ] = await Promise.all([
    prisma.batch.count({
      where: { createdAt: { gte: today, lt: tomorrow }, deletedAt: null },
    }),
    prisma.batch.count({ where: { status: "QC_PENDING", deletedAt: null } }),
    prisma.batch.count({
      where: { status: "PENDING_MANAGER_APPROVAL", deletedAt: null },
    }),
    prisma.batch.count({
      where: {
        status: "RELEASED",
        updatedAt: { gte: firstOfMonth },
        deletedAt: null,
      },
    }),
    prisma.batch.count({
      where: {
        status: { in: ["QC_REJECTED", "REJECTED"] },
        updatedAt: { gte: firstOfMonth },
        deletedAt: null,
      },
    }),
    prisma.cOA.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { batch: { include: { product: true } } },
    }),
    prisma.qCReport.count({
      where: { overallResult: "PASS", createdAt: { gte: firstOfMonth } },
    }),
    prisma.qCReport.count({
      where: { overallResult: "FAIL", createdAt: { gte: firstOfMonth } },
    }),
    // Chart: status distribution
    prisma.batch.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    // Chart: batches created in last 30 days
    prisma.batch.findMany({
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Chart: top 8 products by batch count
    prisma.batch.groupBy({
      by: ["productId"],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
  ])

  // Build trend data: one entry per day for last 30 days
  const trendMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    trendMap.set(d.toISOString().split("T")[0], 0)
  }
  for (const b of batchesLast30) {
    const key = b.createdAt.toISOString().split("T")[0]
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1)
  }
  const trendData = Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  // Resolve product names for product chart
  const productIds = productGroups.map((p) => p.productId)
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, nameTh: true, productCode: true },
        })
      : []
  const productMap = new Map(products.map((p) => [p.id, p]))

  const statusData = statusGroups.map((s) => ({
    status: s.status,
    count: s._count.id,
  }))
  const productData = productGroups.map((p) => ({
    code: productMap.get(p.productId)?.productCode ?? "?",
    name: productMap.get(p.productId)?.nameTh ?? "Unknown",
    count: p._count.id,
  }))

  const totalQC = passCount + failCount
  const passRate = totalQC > 0 ? Math.round((passCount / totalQC) * 100) : null

  return {
    todayBatches,
    qcPending,
    pendingManagerApproval,
    releasedThisMonth,
    rejectedThisMonth,
    recentCOAs,
    passRate,
    totalQC,
    statusData,
    trendData,
    productData,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData(session!.user.id, session!.user.role)

  const kpis = [
    {
      label: "ผลิตวันนี้",
      value: data.todayBatches,
      icon: FlaskConical,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "รอ QC",
      value: data.qcPending,
      icon: Clock,
      color: data.qcPending > 0 ? "text-amber-600" : "text-gray-400",
      bg: data.qcPending > 0 ? "bg-amber-50" : "bg-gray-50",
      urgent: data.qcPending > 0,
      href: "/batches?status=QC_PENDING",
    },
    {
      label: "รออนุมัติผู้จัดการ",
      value: data.pendingManagerApproval,
      icon: AlertCircle,
      color:
        data.pendingManagerApproval > 0 ? "text-orange-600" : "text-gray-400",
      bg:
        data.pendingManagerApproval > 0 ? "bg-orange-50" : "bg-gray-50",
      urgent: data.pendingManagerApproval > 0,
      href: "/batches?status=PENDING_MANAGER_APPROVAL",
    },
    {
      label: "ปล่อยจำหน่ายเดือนนี้",
      value: data.releasedThisMonth,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "ถูกปฏิเสธเดือนนี้",
      value: data.rejectedThisMonth,
      icon: XCircle,
      color: data.rejectedThisMonth > 0 ? "text-red-600" : "text-gray-400",
      bg: data.rejectedThisMonth > 0 ? "bg-red-50" : "bg-gray-50",
    },
    {
      label: "QC ผ่านเดือนนี้",
      value: data.passRate !== null ? `${data.passRate}%` : "—",
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      sub: data.totalQC > 0 ? `จาก ${data.totalQC} รายการ` : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#003B73]">แดชบอร์ด</h1>
        <p className="text-sm text-gray-500 mt-0.5">ภาพรวมระบบ LIMS</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={kpi.urgent ? "ring-2 ring-amber-300" : ""}>
            <CardContent className="p-4">
              {kpi.href ? (
                <Link href={kpi.href} className="block">
                  <KPIContent kpi={kpi} />
                </Link>
              ) : (
                <KPIContent kpi={kpi} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#003B73]" />
          <h2 className="text-sm font-semibold text-[#003B73]">กราฟวิเคราะห์</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>สถานะ Batch ทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchStatusChart data={data.statusData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Batch 30 วันที่ผ่านมา</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchTrendChart data={data.trendData} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product batch counts */}
      <Card>
        <CardHeader>
          <CardTitle>จำนวน Batch แยกตามผลิตภัณฑ์ (Top 8)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductBatchChart data={data.productData} />
        </CardContent>
      </Card>

      {/* Recent COAs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              COA ล่าสุด
            </div>
          </CardTitle>
          <Link href="/coas" className="text-xs text-[#00AEEF] hover:underline">
            ดูทั้งหมด
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentCOAs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 text-center">
              ยังไม่มี COA
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    COA Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    สินค้า
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    วันที่
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    ผล
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {data.recentCOAs.map((coa) => (
                  <tr
                    key={coa.id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#003B73]">
                      <Link
                        href={`/coa/${coa.coaNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {coa.coaNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {coa.batch.product.nameTh}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {coa.batch.batchNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(coa.issueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge status={coa.batch.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPIContent({
  kpi,
}: {
  kpi: {
    label: string
    value: string | number
    icon: React.ElementType
    color: string
    bg: string
    sub?: string
    urgent?: boolean
  }
}) {
  return (
    <div>
      <div
        className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}
      >
        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{kpi.label}</p>
      {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
    </div>
  )
}
