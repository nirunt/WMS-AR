import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatus, UserRole } from "@/lib/db"
import { auditService } from "@/lib/services/audit.service"
import { notificationService } from "@/lib/notifications"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.MANAGER && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const comment = body?.comment?.trim()
  if (!comment) {
    return NextResponse.json({ error: "Comment is required for rejection" }, { status: 422 })
  }

  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { product: true, createdBy: true },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (batch.status !== BatchStatus.PENDING_MANAGER_APPROVAL) {
    return NextResponse.json({ error: "Invalid status" }, { status: 409 })
  }

  const [updated] = await prisma.$transaction([
    prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.REJECTED },
    }),
    prisma.approval.create({
      data: {
        batchId: id,
        approverId: session.user.id,
        stage: "MANAGER",
        decision: "REJECTED",
        comment,
      },
    }),
  ])

  await auditService.log({
    userId: session.user.id,
    action: "MANAGER_REJECTED",
    entityType: "Batch",
    entityId: id,
    oldValues: { status: batch.status },
    newValues: { status: BatchStatus.REJECTED, comment },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  })

  await notificationService.send({
    recipients: [batch.createdBy],
    subject: `[LIMS] Batch ${batch.batchNumber} ถูกปฏิเสธ`,
    body: `Batch ${batch.batchNumber} ถูกปฏิเสธโดยผู้จัดการ เหตุผล: ${comment}`,
  })

  return NextResponse.json({ batch: updated })
}
