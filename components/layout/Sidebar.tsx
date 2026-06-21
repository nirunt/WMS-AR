"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Award,
  Package,
  Search,
  Users,
  ClipboardList,
  Settings,
} from "lucide-react"

type UserRole = "ADMIN" | "PRODUCTION" | "QC" | "MANAGER"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/batches", label: "Batch การผลิต", icon: FlaskConical },
  { href: "/coas", label: "COA", icon: Award },
  { href: "/products", label: "สินค้า", icon: Package, roles: ["ADMIN", "MANAGER", "QC"] },
  { href: "/search", label: "ค้นหา", icon: Search },
]

const adminItems: NavItem[] = [
  { href: "/settings/users", label: "ผู้ใช้งาน", icon: Users, roles: ["ADMIN"] },
  { href: "/audit-trail", label: "ประวัติการใช้งาน", icon: ClipboardList, roles: ["ADMIN"] },
  { href: "/settings/profile", label: "ตั้งค่า", icon: Settings },
]

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href)

  const canAccess = (item: NavItem) =>
    !item.roles || item.roles.includes(role)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-[#003B73] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#00AEEF] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">UV</span>
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-semibold text-sm truncate">U&V Holding</p>
          <p className="text-white/50 text-xs truncate">LIMS System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.filter(canAccess).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-white/15 text-white border-l-2 border-[#00AEEF]"
                    : "text-white/70 hover:bg-white/8 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {role === "ADMIN" && (
          <>
            <div className="mt-6 mb-2 px-3">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-wider">
                Admin
              </p>
            </div>
            <ul className="space-y-0.5">
              {adminItems.filter(canAccess).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-white/15 text-white border-l-2 border-[#00AEEF]"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {role !== "ADMIN" && (
          <ul className="space-y-0.5 mt-4">
            {adminItems
              .filter((i) => i.href === "/settings/profile")
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-white/15 text-white border-l-2 border-[#00AEEF]"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
