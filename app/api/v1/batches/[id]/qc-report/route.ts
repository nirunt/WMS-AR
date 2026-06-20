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
  const report = await prisma.qCReport.findUnique({
    where: { batchId: id },
    include: {
      qcOfficer: { select: { fullName: true } },
      items: {
        include: { templateItem: true },
        orderBy: { sortOrder: "asc" },
      },
    },
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
  if (session.user.role !== UserRole.QC && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: { product: { include: { qcTemplate: { include: { items: { orderBy: { sortOrder: "asc" } } } } } } },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = await prisma.qCReport.findUnique({ where: { batchId: id } })
  if (existing?.signatureMeta) {
    return NextResponse.json({ error: "QC report already signed" }, { status: 409 })
  }

  const body = await req.json()
  const templateItems = batch.product.qcTemplate?.items ?? []

  const report = await prisma.qCReport.upsert({
    where: { batchId: id },
    update: {
      qcOfficerId: session.user.id,
      notes: body.notes,
    },
    create: {
      batchId: id,
      qcOfficerId: session.user.id,
      notes: body.notes,
      items: {
        create: templateItems.map((ti, idx) => ({
          templateItemId: ti.id,
          sortOrder: idx,
        })),
      },
    },
    include: { items: { include: { templateItem: true }, orderBy: { sortOrder: "asc" } } },
  })

  return NextResponse.json({ report })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.QC && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const report = await prisma.qCReport.findUnique({ where: { batchId: id } })
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (report.signatureMeta) return NextResponse.json({ error: "Already signed" }, { status: 409 })

  const { items }: { items: Array<{ id: string; measuredValue?: number | null; textResult?: string | null; passFail?: string | null }> } = body

  await Promise.all(
    (items ?? []).map((item) =>
      prisma.qCReportItem.update({
        where: { id: item.id },
        data: {
          measuredValue: item.measuredValue != null ? Number(item.measuredValue) : null,
          textResult: item.textResult ?? null,
          passFail: item.passFail ?? null,
        },
      }),
    ),
  )

  return NextResponse.json({ success: true })
}
