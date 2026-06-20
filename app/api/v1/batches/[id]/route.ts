import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: {
      product: true,
      createdBy: { select: { fullName: true, email: true } },
      rawMaterials: { orderBy: { createdAt: "asc" } },
      batchReport: {
        include: { signedBy: { select: { fullName: true } } },
      },
      qcReport: {
        include: {
          qcOfficer: { select: { fullName: true } },
          items: {
            include: { templateItem: { select: { testName: true, unit: true, minValue: true, maxValue: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      coa: true,
      approvals: {
        include: { approver: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ batch })
}
