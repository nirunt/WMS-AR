import { prisma } from "@/lib/prisma"

export async function generateBatchNumber(
  productCode: string,
  productId: string,
  mfgDate: Date
): Promise<string> {
  const dateKey = new Date(mfgDate)
  dateKey.setHours(0, 0, 0, 0)

  const yy = String(dateKey.getFullYear()).slice(-2)
  const mm = String(dateKey.getMonth() + 1).padStart(2, "0")
  const dd = String(dateKey.getDate()).padStart(2, "0")
  const datePart = `${yy}${mm}${dd}`

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.batchSequence.findUnique({
      where: { productId_dateKey: { productId, dateKey } },
    })
    if (existing) {
      const updated = await tx.batchSequence.update({
        where: { productId_dateKey: { productId, dateKey } },
        data: { lastSeq: { increment: 1 } },
      })
      return updated.lastSeq
    } else {
      const created = await tx.batchSequence.create({
        data: { productId, dateKey, lastSeq: 1 },
      })
      return created.lastSeq
    }
  })

  return `${productCode}-${datePart}-${String(seq).padStart(3, "0")}`
}

export async function generateCOANumber(issueDate: Date): Promise<string> {
  const dateKey = new Date(issueDate)
  dateKey.setHours(0, 0, 0, 0)

  const yyyy = dateKey.getFullYear()
  const mm = String(dateKey.getMonth() + 1).padStart(2, "0")
  const dd = String(dateKey.getDate()).padStart(2, "0")
  const datePart = `${yyyy}${mm}${dd}`

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.cOASequence.findUnique({
      where: { dateKey },
    })
    if (existing) {
      const updated = await tx.cOASequence.update({
        where: { dateKey },
        data: { lastSeq: { increment: 1 } },
      })
      return updated.lastSeq
    } else {
      const created = await tx.cOASequence.create({
        data: { dateKey, lastSeq: 1 },
      })
      return created.lastSeq
    }
  })

  return `COA-${datePart}-${String(seq).padStart(3, "0")}`
}
