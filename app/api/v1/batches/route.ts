import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatus, UserRole } from "@/lib/db"
import { createBatchSchema } from "@/lib/validators/batch.schema"
import { generateBatchNumber } from "@/lib/services/sequence.service"
import { auditService } from "@/lib/services/audit.service"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20))
  const status = searchParams.get("status") as BatchStatus | null
  const q = searchParams.get("q")?.trim()

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { batchNumber: { contains: q, mode: "insensitive" as const } },
            { product: { nameEn: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [total, batches] = await Promise.all([
    prisma.batch.count({ where }),
    prisma.batch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { nameEn: true, sku: true } },
        createdBy: { select: { fullName: true } },
      },
    }),
  ])

  return NextResponse.json({ batches, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== UserRole.PRODUCTION && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createBatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { productId, productionDate, expiryDate, quantity, quantityUnit, notes } = parsed.data

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true, deletedAt: null } })
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const batchNumber = await generateBatchNumber(product.sku)

  const batch = await prisma.batch.create({
    data: {
      batchNumber,
      productId,
      productionDate: new Date(productionDate),
      expiryDate: new Date(expiryDate),
      quantity,
      quantityUnit,
      notes,
      status: BatchStatus.DRAFT,
      createdById: session.user.id,
    },
  })

  await auditService.log({
    userId: session.user.id,
    action: "BATCH_CREATED",
    entityType: "Batch",
    entityId: batch.id,
    newValues: { batchNumber, productId, status: BatchStatus.DRAFT },
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
  })

  return NextResponse.json({ batch }, { status: 201 })
}
