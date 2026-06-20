import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserRole, BatchStatus } from "@/lib/db"
import { notFound } from "next/navigation"
import { QCReportForm } from "@/components/batch/QCReportForm"

export default async function QCReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (
    session.user.role !== UserRole.QC &&
    session.user.role !== UserRole.ADMIN
  ) {
    redirect("/dashboard")
  }

  const { id } = await params

  const batch = await prisma.batch.findUnique({
    where: { id, deletedAt: null },
    include: {
      product: {
        include: {
          qcTemplate: {
            include: { items: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      qcReport: {
        include: {
          items: {
            include: {
              templateItem: {
                select: {
                  testName: true,
                  unit: true,
                  minValue: true,
                  maxValue: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  if (!batch) notFound()
  if (batch.status !== BatchStatus.QC_PENDING && !batch.qcReport) {
    redirect(`/batches/${id}`)
  }

  let qcReport = batch.qcReport

  if (!qcReport && batch.status === BatchStatus.QC_PENDING) {
    const templateItems = batch.product.qcTemplate?.items ?? []
    qcReport = await prisma.qCReport.upsert({
      where: { batchId: id },
      update: {},
      create: {
        batchId: id,
        qcOfficerId: session.user.id,
        items: {
          create: templateItems.map((ti, idx) => ({
            templateItemId: ti.id,
            sortOrder: idx,
          })),
        },
      },
      include: {
        items: {
          include: {
            templateItem: {
              select: {
                testName: true,
                unit: true,
                minValue: true,
                maxValue: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  }

  if (!qcReport) redirect(`/batches/${id}`)

  const serializedItems = qcReport.items.map((item) => ({
    id: item.id,
    measuredValue: item.measuredValue ? Number(item.measuredValue) : null,
    textResult: item.textResult,
    passFail: item.passFail,
    sortOrder: item.sortOrder,
    templateItem: {
      testName: item.templateItem.testName,
      unit: item.templateItem.unit,
      minValue: item.templateItem.minValue
        ? Number(item.templateItem.minValue)
        : null,
      maxValue: item.templateItem.maxValue
        ? Number(item.templateItem.maxValue)
        : null,
    },
  }))

  const serializedReport = {
    id: qcReport.id,
    notes: qcReport.notes,
    overallResult: qcReport.overallResult,
    signatureMeta: qcReport.signatureMeta,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <QCReportForm
        batchId={id}
        initialReport={serializedReport}
        initialItems={serializedItems}
        productName={batch.product.nameEn}
        batchNumber={batch.batchNumber}
      />
    </div>
  )
}
