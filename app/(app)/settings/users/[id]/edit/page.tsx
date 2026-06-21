import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EditUserForm } from "@/components/user/EditUserForm"
import { UserCog, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      isActive: true,
    },
  })

  if (!user) redirect("/settings/users")

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <Link
          href="/settings/users"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003B73] mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          กลับ
        </Link>
        <h1 className="text-xl font-bold text-[#003B73] flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          แก้ไขผู้ใช้งาน
        </h1>
      </div>
      <EditUserForm user={user} />
    </div>
  )
}
