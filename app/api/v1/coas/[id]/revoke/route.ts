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
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const reason = body?.reason?.trim()

  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 422 })
  }

  const coa = await prisma.cOA.findUnique({ where: { id } })
  if (!coa) return NextResponse.json({ error: "COA not found" }, { status: 404 })
  if (coa.isRevoked) {
    return NextResponse.json({ error: "COA already revoked" }, { status: 409 })
  }

  const updated = await prisma.cOA.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedReason: reason,
    },
  })

  await auditService.log({
    userId: session.user.id,
    action: "COA_REVOKED",
    entityType: "COA",
    entityId: id,
    newValues: { coaNumber: coa.coaNumber, reason },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  })

  return NextResponse.json({ coa: updated })
}
