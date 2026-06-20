import { prisma } from "@/lib/prisma"
import { BatchStatus, UserRole } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Card } from "@/components/shared/Card"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import { Button } from "@/components/shared/Button"
import { BATCH_STATUS_LABELS } from "@/lib/utils"

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
  status?: string
  q?: string
}

async function getBatches(searchParams: SearchParams) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const status = searchParams.status as BatchStatus | undefined
  const q = searchParams.q?.trim()

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { batchNumber: { contains: q, mode: "insensitive" as const } },
            { product: { nameEn: { contains: q, mode: "insensitive" as const } } },
            { product: { nameTh: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [total, batches] = await Promise.all([
    prisma.batch.count({ where }),
    prisma.batch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: true, createdBy: { select: { fullName: true } } },
    }),
  ])

  return { batches, total, page, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await auth()
  const { batches, total, page, totalPages } = await getBatches(params)

  const canCreate = session?.user?.role === UserRole.PRODUCTION || session?.user?.role === UserRole.ADMIN

  const statusFilters: Array<{ value: string; label: string }> = [
    { value: "", label: "ทั้งหมด" },
    ...Object.values(BatchStatus).map((s) => ({ value: s, label: BATCH_STATUS_LABELS[s] })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">บันทึก Batch</h1>
        {canCreate && (
          <Link href="/batches/new">
            <Button
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              สร้าง Batch ใหม่
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={`/batches?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              params.status === f.value || (!params.status && f.value === "")
                ? "bg-[#003B73] text-white border-[#003B73]"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["เลข Batch", "สินค้า", "สถานะ", "ผลิตโดย", "วันที่สร้าง", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    ไม่มีบันทึก
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-[#003B73]">
                      {batch.batchNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{batch.product.nameEn}</td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge status={batch.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{batch.createdBy.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(batch.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/batches/${batch.id}`}
                        className="text-sm text-[#003B73] hover:underline font-medium"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} จาก {total} รายการ
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/batches?page=${page - 1}&status=${params.status ?? ""}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ก่อนหน้า
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/batches?page=${page + 1}&status=${params.status ?? ""}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ถัดไป
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
