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
  const report = await prisma.batchReport.findUnique({
    where: { batchId: id },
    include: { signedBy: { select: { fullName: true } } },
  })

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ report })
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

  const existing = await prisma.batchReport.findUnique({ where: { batchId: id } })
  if (existing?.signatureMeta) {
    return NextResponse.json({ error: "Report is already signed and cannot be edited" }, { status: 409 })
  }

  const body = await req.json()

  const report = await prisma.batchReport.upsert({
    where: { batchId: id },
    update: {
      productionNotes: body.productionNotes,
      equipmentUsed: body.equipmentUsed,
      environmentTemp: body.environmentTemp != null ? Number(body.environmentTemp) : undefined,
      environmentHumidity: body.environmentHumidity != null ? Number(body.environmentHumidity) : undefined,
    },
    create: {
      batchId: id,
      productionNotes: body.productionNotes,
      equipmentUsed: body.equipmentUsed,
      environmentTemp: body.environmentTemp != null ? Number(body.environmentTemp) : undefined,
      environmentHumidity: body.environmentHumidity != null ? Number(body.environmentHumidity) : undefined,
    },
  })

  return NextResponse.json({ report })
}
