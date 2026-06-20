import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rmId: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.PRODUCTION && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { rmId } = await params
  const body = await req.json()

  const material = await prisma.rawMaterial.update({
    where: { id: rmId, deletedAt: null },
    data: {
      materialName: body.materialName?.trim(),
      certificateNumber: body.certificateNumber?.trim() ?? null,
      lotNumber: body.lotNumber?.trim() ?? null,
      quantity: body.quantity != null ? Number(body.quantity) : null,
      unit: body.unit?.trim() ?? null,
      supplier: body.supplier?.trim() ?? null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  })

  return NextResponse.json({ material })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rmId: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.PRODUCTION && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { rmId } = await params
  await prisma.rawMaterial.update({
    where: { id: rmId },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
