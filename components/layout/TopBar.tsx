"use client"

import { signOut } from "next-auth/react"
import { Bell, LogOut, User, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type UserRole = "ADMIN" | "PRODUCTION" | "QC" | "MANAGER"

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  PRODUCTION: "ฝ่ายผลิต",
  QC: "ฝ่าย QC",
  MANAGER: "ผู้จัดการ",
}

interface TopBarProps {
  userName: string
  userRole: UserRole
  notificationCount?: number
}

export function TopBar({ userName, userRole, notificationCount = 0 }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-60 right-0 z-30 h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6">
      {/* Left: breadcrumb placeholder */}
      <div>
        <h1 className="text-sm font-medium text-gray-500">
          U&V Holding — LIMS
        </h1>
      </div>

      {/* Right: notification + user */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#003B73] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[userRole]}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className={cn(
                "absolute right-0 top-full mt-1 w-48 bg-white border border-[#e2e8f0]",
                "rounded-lg shadow-lg z-20 overflow-hidden"
              )}>
                <div className="px-3 py-2 border-b border-[#e2e8f0]">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[userRole]}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
