import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const materials = await prisma.rawMaterial.findMany({
    where: { batchId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ materials })
}

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
  const batch = await prisma.batch.findUnique({ where: { id, deletedAt: null } })
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  if (!body.materialName?.trim()) {
    return NextResponse.json({ error: "materialName is required" }, { status: 422 })
  }

  const material = await prisma.rawMaterial.create({
    data: {
      batchId: id,
      materialName: body.materialName.trim(),
      certificateNumber: body.certificateNumber?.trim() ?? null,
      lotNumber: body.lotNumber?.trim() ?? null,
      quantity: body.quantity != null ? Number(body.quantity) : null,
      unit: body.unit?.trim() ?? null,
      supplier: body.supplier?.trim() ?? null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  })

  return NextResponse.json({ material }, { status: 201 })
}
