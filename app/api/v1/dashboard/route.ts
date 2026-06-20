import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatus } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))

  const [todayBatches, qcPending, pendingManagerApproval, releasedThisMonth, rejectedThisMonth, totalQCThisMonth, passedQCThisMonth] =
    await Promise.all([
      prisma.batch.count({ where: { createdAt: { gte: startOfDay }, deletedAt: null } }),
      prisma.batch.count({ where: { status: BatchStatus.QC_PENDING, deletedAt: null } }),
      prisma.batch.count({ where: { status: BatchStatus.PENDING_MANAGER_APPROVAL, deletedAt: null } }),
      prisma.batch.count({ where: { status: BatchStatus.RELEASED, releaseDate: { gte: startOfMonth }, deletedAt: null } }),
      prisma.batch.count({
        where: {
          status: { in: [BatchStatus.QC_REJECTED, BatchStatus.REJECTED] },
          updatedAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      prisma.qCReport.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      prisma.qCReport.count({ where: { overallResult: "PASS", createdAt: { gte: startOfMonth }, deletedAt: null } }),
    ])

  const passRate = totalQCThisMonth > 0 ? Math.round((passedQCThisMonth / totalQCThisMonth) * 100) : null

  return NextResponse.json({
    todayBatches,
    qcPending,
    pendingManagerApproval,
    releasedThisMonth,
    rejectedThisMonth,
    passRate,
  })
}
