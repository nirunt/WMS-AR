"use client"

import { useState, useEffect } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  PRODUCTION_COMPLETE: "#60a5fa",
  QC_PENDING: "#fbbf24",
  QC_APPROVED: "#34d399",
  QC_REJECTED: "#f87171",
  PENDING_MANAGER_APPROVAL: "#a78bfa",
  RELEASED: "#10b981",
  REJECTED: "#ef4444",
  ARCHIVED: "#9ca3af",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "ร่าง",
  PRODUCTION_COMPLETE: "ผลิตเสร็จ",
  QC_PENDING: "รอ QC",
  QC_APPROVED: "QC อนุมัติ",
  QC_REJECTED: "QC ปฏิเสธ",
  PENDING_MANAGER_APPROVAL: "รอผู้จัดการ",
  RELEASED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  ARCHIVED: "เก็บถาวร",
}

interface StatusData {
  status: string
  count: number
}

export function BatchStatusChart({ data }: { data: StatusData[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status] ?? d.status,
      value: d.count,
      status: d.status,
    }))

  if (!mounted) {
    return <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        ยังไม่มีข้อมูล batch
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#cbd5e1"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} batch`, ""]}
          contentStyle={{
            fontSize: 12,
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
