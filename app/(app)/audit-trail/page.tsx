import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"
import { Card } from "@/components/shared/Card"
import Link from "next/link"

const PAGE_SIZE = 30

interface SearchParams {
  page?: string
}

export default async function AuditTrailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth()
  if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.MANAGER) {
    redirect("/dashboard")
  }

  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { fullName: true } } },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["เวลา", "ผู้ใช้", "การกระทำ", "Entity", "Entity ID", "IP"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    ไม่มีบันทึก
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-2.5 text-sm">{log.user?.fullName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{log.entityType}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-400">
                      {log.entityId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              หน้า {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/audit-trail?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ก่อนหน้า
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/audit-trail?page=${page + 1}`}
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
