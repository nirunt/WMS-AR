import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"
import { auditService } from "@/lib/services/audit.service"

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

  const report = await prisma.qCReport.findUnique({
    where: { batchId: id },
    include: { items: true },
  })

  if (!report) return NextResponse.json({ error: "QC report not found" }, { status: 404 })
  if (report.signatureMeta) return NextResponse.json({ error: "Already signed" }, { status: 409 })

  const hasUnjudged = report.items.some((item) => !item.passFail)
  if (hasUnjudged) {
    return NextResponse.json({ error: "All test items must have a PASS/FAIL result" }, { status: 422 })
  }

  const overallResult = report.items.every((item) => item.passFail === "PASS") ? "PASS" : "FAIL"

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

  await prisma.qCReport.update({
    where: { id: report.id },
    data: {
      overallResult,
      signatureMeta,
      signedAt: new Date(),
    },
  })

  await auditService.log({
    userId: session.user.id,
    action: "QC_REPORT_SIGNED",
    entityType: "QCReport",
    entityId: report.id,
    newValues: { overallResult, signedAt: signatureMeta.timestampUtc },
    ipAddress: ip,
  })

  return NextResponse.json({ success: true, overallResult })
}
