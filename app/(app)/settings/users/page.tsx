import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/db"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Button } from "@/components/shared/Button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "ผู้ดูแลระบบ",
  [UserRole.PRODUCTION]: "ฝ่ายผลิต",
  [UserRole.QC]: "ฝ่าย QC",
  [UserRole.MANAGER]: "ผู้จัดการ",
}

const ROLE_BADGE: Record<
  UserRole,
  "default" | "success" | "warning" | "danger" | "info" | "gray"
> = {
  [UserRole.ADMIN]: "danger",
  [UserRole.PRODUCTION]: "info",
  [UserRole.QC]: "warning",
  [UserRole.MANAGER]: "default",
}

export default async function UsersPage() {
  const session = await auth()
  if (session?.user?.role !== UserRole.ADMIN) redirect("/dashboard")

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { fullName: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <Link href="/settings/users/new">
          <Button
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            เพิ่มผู้ใช้
          </Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "ชื่อ-นามสกุล",
                  "อีเมล",
                  "บทบาท",
                  "สถานะ",
                  "เข้าใช้ล่าสุด",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_BADGE[user.role as UserRole]}>
                      {ROLE_LABELS[user.role as UserRole]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "gray"}>
                      {user.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.lastLoginAt
                      ? formatDate(user.lastLoginAt)
                      : "ยังไม่เคยเข้าใช้"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
