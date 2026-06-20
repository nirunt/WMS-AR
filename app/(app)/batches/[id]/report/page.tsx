import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"
import { notFound } from "next/navigation"
import { BatchReportForm } from "@/components/batch/BatchReportForm"

export default async function BatchReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (
    session.user.role !== UserRole.PRODUCTION &&
    session.user.role !== UserRole.ADMIN
  ) {
    redirect("/dashboard")
  }

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: {
      product: true,
      batchReport: {
        include: { signedBy: { select: { fullName: true } } },
      },
    },
  })

  if (!batch) notFound()

  const serializedReport = batch.batchReport
    ? {
        id: batch.batchReport.id,
        productionNotes: batch.batchReport.productionNotes,
        equipmentUsed: batch.batchReport.equipmentUsed,
        environmentTemp: batch.batchReport.environmentTemp
          ? Number(batch.batchReport.environmentTemp)
          : null,
        environmentHumidity: batch.batchReport.environmentHumidity
          ? Number(batch.batchReport.environmentHumidity)
          : null,
        signatureMeta: batch.batchReport.signatureMeta,
        signedAt: batch.batchReport.signedAt?.toISOString() ?? null,
      }
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <BatchReportForm
        batchId={id}
        initialReport={serializedReport}
        productName={batch.product.nameEn}
        batchNumber={batch.batchNumber}
      />
    </div>
  )
}
