import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/shared/Card"
import { Button } from "@/components/shared/Button"
import { formatDate } from "@/lib/utils"
import { Users, UserPlus, ShieldCheck, Pencil } from "lucide-react"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRODUCTION: "ผลิต",
  QC: "QC",
  MANAGER: "ผู้จัดการ",
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  PRODUCTION: "bg-blue-100 text-blue-700",
  QC: "bg-teal-100 text-teal-700",
  MANAGER: "bg-orange-100 text-orange-700",
}

export default async function UsersPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#003B73] flex items-center gap-2">
            <Users className="w-5 h-5" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ทั้งหมด {users.length} บัญชี</p>
        </div>
        <Link href="/settings/users/new">
          <Button>
            <UserPlus className="w-4 h-4" />
            เพิ่มผู้ใช้งาน
          </Button>
        </Link>
      </div>

      <Card>
        {users.length === 0 ? (
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#003B73]/5 flex items-center justify-center mb-3 mx-auto">
              <Users className="w-7 h-7 text-[#003B73]/30" />
            </div>
            <p className="text-sm font-medium text-gray-700">ไม่มีผู้ใช้งาน</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">อีเมล</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">แผนก</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">บทบาท</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">เข้าใช้งานล่าสุด</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-[#003B73]/[0.02] ${
                      !user.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          user.isActive ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        {user.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "ยังไม่เคยเข้าใช้"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/settings/users/${user.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-3.5 h-3.5" />
                          แก้ไข
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
