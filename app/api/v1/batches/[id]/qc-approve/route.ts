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
  if (session.user.role !== UserRole.QC && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { qcReport: true, product: true, createdBy: true },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (batch.status !== BatchStatus.QC_PENDING) {
    return NextResponse.json({ error: "Batch is not in QC_PENDING status" }, { status: 409 })
  }
  if (!batch.qcReport?.signatureMeta) {
    return NextResponse.json({ error: "QC report must be signed" }, { status: 422 })
  }

  const [updated] = await prisma.$transaction([
    prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.PENDING_MANAGER_APPROVAL },
    }),
    prisma.approval.create({
      data: {
        batchId: id,
        approverId: session.user.id,
        stage: "QC",
        decision: "APPROVED",
      },
    }),
  ])

  await auditService.log({
    userId: session.user.id,
    action: "QC_APPROVED",
    entityType: "Batch",
    entityId: id,
    oldValues: { status: batch.status },
    newValues: { status: BatchStatus.PENDING_MANAGER_APPROVAL },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  })

  const managers = await prisma.user.findMany({
    where: { role: UserRole.MANAGER, isActive: true, deletedAt: null },
  })
  await notificationService.send({
    recipients: managers,
    subject: `[LIMS] Batch ${batch.batchNumber} รออนุมัติจากผู้จัดการ`,
    body: `Batch ${batch.batchNumber} (${batch.product.nameEn}) ผ่าน QC แล้ว รอดำเนินการ`,
  })

  return NextResponse.json({ batch: updated })
}
