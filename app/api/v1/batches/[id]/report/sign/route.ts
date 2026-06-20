import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatus, UserRole } from "@/lib/db"
import { auditService } from "@/lib/services/audit.service"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.PRODUCTION && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { batchReport: true },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!batch.batchReport) return NextResponse.json({ error: "Batch report not found" }, { status: 404 })
  if (batch.batchReport.signatureMeta) {
    return NextResponse.json({ error: "Already signed" }, { status: 409 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const ua = req.headers.get("user-agent") ?? "unknown"

  const signatureMeta = {
    version: "1.0",
    method: "credentials",
    fullName: user.fullName,
    userId: user.id,
    email: user.email,
    timestampUtc: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
  }

  await prisma.$transaction([
    prisma.batchReport.update({
      where: { batchId: id },
      data: {
        signatureMeta,
        signedById: session.user.id,
        signedAt: new Date(),
      },
    }),
    prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.PRODUCTION_COMPLETE },
    }),
  ])

  await auditService.log({
    userId: session.user.id,
    action: "BATCH_REPORT_SIGNED",
    entityType: "BatchReport",
    entityId: batch.batchReport.id,
    newValues: { signedAt: signatureMeta.timestampUtc },
    ipAddress: ip,
  })

  return NextResponse.json({ success: true, signedAt: signatureMeta.timestampUtc })
}
