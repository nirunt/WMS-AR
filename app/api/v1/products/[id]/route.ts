import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/services/audit.service"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const product = await prisma.productMaster.findUnique({
    where: { id, deletedAt: null },
    include: { qcTemplate: { select: { id: true, name: true } } },
  })

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ data: product })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as Record<string, unknown>

  const allowed = ["nameTh", "nameEn", "category", "shelfLifeDays", "storageCondition", "isActive"]
  const updateData: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updateData[key] = body[key]
  }

  const product = await prisma.productMaster.update({
    where: { id, deletedAt: null },
    data: updateData,
  })

  await recordAudit({
    entityType: "product",
    entityId: product.id,
    action: "UPDATE",
    userId: session.user.id,
    userName: session.user.name,
    userRole: session.user.role,
    newValues: updateData,
  })

  return NextResponse.json({ data: product })
}
