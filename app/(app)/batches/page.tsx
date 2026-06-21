import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import { Card } from "@/components/shared/Card"
import { Button } from "@/components/shared/Button"
import { formatDate } from "@/lib/utils"
import { Plus, FlaskConical } from "lucide-react"
import Link from "next/link"

type BatchStatus =
  | "DRAFT"
  | "PRODUCTION_COMPLETE"
  | "QC_PENDING"
  | "QC_APPROVED"
  | "QC_REJECTED"
  | "PENDING_MANAGER_APPROVAL"
  | "RELEASED"
  | "REJECTED"
  | "ARCHIVED"

interface SearchParams {
  status?: string
  productId?: string
  q?: string
  page?: string
}

async function getBatches(searchParams: SearchParams) {
  const page = parseInt(searchParams.page ?? "1")
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = { deletedAt: null }

  if (searchParams.status && searchParams.status !== "ALL") {
    where.status = searchParams.status as BatchStatus
  }
  if (searchParams.productId) {
    where.productId = searchParams.productId
  }
  if (searchParams.q) {
    where.OR = [
      { batchNumber: { contains: searchParams.q, mode: "insensitive" } },
      { product: { nameTh: { contains: searchParams.q, mode: "insensitive" } } },
      { product: { nameEn: { contains: searchParams.q, mode: "insensitive" } } },
    ]
  }

  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      include: {
        product: { select: { nameTh: true, nameEn: true, productCode: true } },
        operator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.batch.count({ where }),
  ])

  return { batches, total, page, perPage }
}

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [session, params] = await Promise.all([auth(), searchParams])
  const { batches, total, page, perPage } = await getBatches(params)

  const canCreate = ["ADMIN", "PRODUCTION"].includes(session!.user.role)
  const totalPages = Math.ceil(total / perPage)

  const statuses: { value: string; label: string }[] = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "DRAFT", label: "ร่าง" },
    { value: "PRODUCTION_COMPLETE", label: "ผลิตเสร็จ" },
    { value: "QC_PENDING", label: "รอ QC" },
    { value: "QC_APPROVED", label: "QC อนุมัติ" },
    { value: "QC_REJECTED", label: "QC ปฏิเสธ" },
    { value: "PENDING_MANAGER_APPROVAL", label: "รออนุมัติผู้จัดการ" },
    { value: "RELEASED", label: "ปล่อยจำหน่าย" },
    { value: "REJECTED", label: "ปฏิเสธ" },
    { value: "ARCHIVED", label: "เก็บถาวร" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#003B73]">Batch การผลิต</h1>
          <p className="text-sm text-gray-500 mt-0.5">ทั้งหมด {total} รายการ</p>
        </div>
        {canCreate && (
          <Link href="/batches/new">
            <Button>
              <Plus className="w-4 h-4" />
              สร้าง Batch ใหม่
            </Button>
          </Link>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => {
          const isActive = (params.status ?? "ALL") === s.value
          return (
            <Link
              key={s.value}
              href={`/batches${s.value !== "ALL" ? `?status=${s.value}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-[#003B73] text-white border-[#003B73]"
                  : "bg-white text-gray-600 border-[#e2e8f0] hover:border-[#003B73] hover:text-[#003B73]"
              }`}
            >
              {s.label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        {batches.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#003B73]/5 flex items-center justify-center mb-3">
              <FlaskConical className="w-7 h-7 text-[#003B73]/30" />
            </div>
            <p className="text-sm font-medium text-gray-700">ไม่มี Batch</p>
            <p className="text-xs text-gray-500 mt-1">ยังไม่มีข้อมูล Batch ในขณะนี้</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">หมายเลข Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สินค้า</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">วันที่ผลิต</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">วันหมดอายุ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">จำนวน</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ผู้ปฏิบัติงาน</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="bg-white hover:bg-[#003B73]/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/batches/${batch.id}`}
                          className="font-semibold text-[#003B73] hover:underline"
                        >
                          {batch.batchNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{batch.product.nameTh}</div>
                        <div className="text-xs text-gray-400">{batch.product.productCode}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {formatDate(batch.manufacturingDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {formatDate(batch.expiryDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(batch.quantityProduced).toLocaleString()} {batch.quantityUnit}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{batch.operator.name}</td>
                      <td className="px-4 py-3">
                        <BatchStatusBadge status={batch.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0]">
                <p className="text-xs text-gray-500">
                  หน้า {page} จาก {totalPages}
                </p>
                <div className="flex gap-1">
                  {page > 1 && (
                    <Link
                      href={`/batches?page=${page - 1}${params.status ? `&status=${params.status}` : ""}`}
                      className="px-3 py-1 text-xs border border-[#e2e8f0] rounded hover:bg-gray-50"
                    >
                      ก่อนหน้า
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/batches?page=${page + 1}${params.status ? `&status=${params.status}` : ""}`}
                      className="px-3 py-1 text-xs border border-[#e2e8f0] rounded hover:bg-gray-50"
                    >
                      ถัดไป
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
