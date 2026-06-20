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

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { batchReport: true, product: true },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.PRODUCTION_COMPLETE) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 409 })
  }
  if (!batch.batchReport?.signatureMeta) {
    return NextResponse.json({ error: "Batch report must be signed before submission" }, { status: 422 })
  }
  if (batch.createdById !== session.user.id && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.batch.update({
    where: { id },
    data: { status: BatchStatus.QC_PENDING },
  })

  await auditService.log({
    userId: session.user.id,
    action: "BATCH_SUBMITTED_FOR_QC",
    entityType: "Batch",
    entityId: id,
    oldValues: { status: batch.status },
    newValues: { status: BatchStatus.QC_PENDING },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  })

  const qcOfficers = await prisma.user.findMany({
    where: { role: UserRole.QC, isActive: true, deletedAt: null },
  })
  await notificationService.send({
    recipients: qcOfficers,
    subject: `[LIMS] Batch ${batch.batchNumber} รอ QC ตรวจสอบ`,
    body: `Batch ${batch.batchNumber} (${batch.product.nameEn}) พร้อมสำหรับการตรวจสอบ QC แล้ว`,
  })

  return NextResponse.json({ batch: updated })
}
