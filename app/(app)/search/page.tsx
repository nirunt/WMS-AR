import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Card } from "@/components/shared/Card"
import { BatchStatusBadge } from "@/components/batch/BatchStatusBadge"
import Link from "next/link"

interface SearchParams {
  q?: string
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  const tooShort = query.length > 0 && query.length < 2

  const batches =
    query.length >= 2
      ? await prisma.batch.findMany({
          where: {
            deletedAt: null,
            OR: [
              { batchNumber: { contains: query, mode: "insensitive" } },
              { product: { nameEn: { contains: query, mode: "insensitive" } } },
              { product: { nameTh: { contains: query, mode: "insensitive" } } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { product: true },
        })
      : []

  const coas =
    query.length >= 2
      ? await prisma.cOA.findMany({
          where: {
            deletedAt: null,
            coaNumber: { contains: query, mode: "insensitive" },
          },
          take: 10,
          include: { batch: { include: { product: true } } },
        })
      : []

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">ค้นหา</h1>

      <form method="GET" action="/search">
        <div className="flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="ค้นหาเลข Batch, ชื่อสินค้า, เลข COA..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73]/40 focus:border-[#003B73]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#003B73] text-white rounded-lg text-sm font-medium hover:bg-[#002d5a]"
          >
            ค้นหา
          </button>
        </div>
      </form>

      {tooShort && (
        <p className="text-sm text-amber-600">กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร</p>
      )}

      {query.length >= 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Batch ({batches.length})
            </h2>
            {batches.length === 0 ? (
              <p className="text-sm text-gray-400">ไม่พบผลลัพธ์</p>
            ) : (
              <Card>
                <table className="min-w-full divide-y divide-gray-100">
                  <tbody className="divide-y divide-gray-100">
                    {batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">
                          <Link href={`/batches/${batch.id}`} className="text-[#003B73] hover:underline">
                            {batch.batchNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{batch.product.nameEn}</td>
                        <td className="px-4 py-3">
                          <BatchStatusBadge status={batch.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(batch.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              COA ({coas.length})
            </h2>
            {coas.length === 0 ? (
              <p className="text-sm text-gray-400">ไม่พบผลลัพธ์</p>
            ) : (
              <Card>
                <table className="min-w-full divide-y divide-gray-100">
                  <tbody className="divide-y divide-gray-100">
                    {coas.map((coa) => (
                      <tr key={coa.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">
                          <Link href={`/coa/${coa.coaNumber}`} className="text-[#003B73] hover:underline">
                            {coa.coaNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{coa.batch.product.nameEn}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{coa.batch.batchNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(coa.issueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
