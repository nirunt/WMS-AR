import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"
import { createProductSchema } from "@/lib/validators/product.schema"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const activeOnly = searchParams.get("activeOnly") === "true"
  const q = searchParams.get("q")?.trim()

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { nameEn: { contains: q, mode: "insensitive" as const } },
              { nameTh: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { sku: "asc" },
    include: { qcTemplate: { select: { name: true } } },
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const product = await prisma.product.create({ data: parsed.data })
  return NextResponse.json({ product }, { status: 201 })
}
