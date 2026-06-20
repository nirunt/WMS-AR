import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatus, UserRole } from "@/lib/db"
import { auditService } from "@/lib/services/audit.service"
import { notificationService } from "@/lib/notifications"
import { generateCOANumber } from "@/lib/services/sequence.service"

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
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { product: true, createdBy: true },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (batch.status !== BatchStatus.PENDING_MANAGER_APPROVAL) {
    return NextResponse.json({ error: "Invalid status" }, { status: 409 })
  }

  const coaNumber = await generateCOANumber()

  const [updated] = await prisma.$transaction([
    prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.RELEASED, releaseDate: new Date() },
    }),
    prisma.approval.create({
      data: {
        batchId: id,
        approverId: session.user.id,
        stage: "MANAGER",
        decision: "APPROVED",
      },
    }),
    prisma.cOA.create({
      data: {
        coaNumber,
        batchId: id,
        issuedById: session.user.id,
        issueDate: new Date(),
      },
    }),
  ])

  await auditService.log({
    userId: session.user.id,
    action: "MANAGER_APPROVED",
    entityType: "Batch",
    entityId: id,
    oldValues: { status: batch.status },
    newValues: { status: BatchStatus.RELEASED, coaNumber },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  })

  await notificationService.send({
    recipients: [batch.createdBy],
    subject: `[LIMS] Batch ${batch.batchNumber} ได้รับการอนุมัติ`,
    body: `Batch ${batch.batchNumber} ได้รับการอนุมัติและออก COA เลขที่ ${coaNumber} แล้ว`,
  })

  return NextResponse.json({ batch: updated, coaNumber })
}
