import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { UserRole } from "@/lib/db"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar role={session.user.role as UserRole} />
      <div className="ml-60">
        <TopBar userName={session.user.name} userRole={session.user.role as UserRole} />
        <main className="pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
