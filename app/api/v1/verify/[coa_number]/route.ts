import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coa_number: string }> },
) {
  const { coa_number } = await params

  const coa = await prisma.cOA.findUnique({
    where: { coaNumber: coa_number },
    select: {
      coaNumber: true,
      issueDate: true,
      isRevoked: true,
      revokedReason: true,
      batch: {
        select: {
          batchNumber: true,
          productionDate: true,
          expiryDate: true,
          product: { select: { nameEn: true, nameTh: true, sku: true } },
          qcReport: { select: { overallResult: true } },
        },
      },
      issuedBy: { select: { fullName: true } },
    },
  })

  if (!coa) return NextResponse.json({ error: "COA not found" }, { status: 404 })

  return NextResponse.json({ coa })
}
