"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ProductData {
  code: string
  name: string
  count: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ProductData }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-xs">
      <p className="font-semibold text-gray-800">{d.code}</p>
      <p className="text-gray-500 mt-0.5 max-w-[180px] truncate">{d.name}</p>
      <p className="text-[#003B73] font-bold mt-1">{d.count} batch</p>
    </div>
  )
}

export function ProductBatchChart({ data }: { data: ProductData[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-52 animate-pulse bg-gray-100 rounded-lg" />
  }

  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-gray-400">
        ยังไม่มีข้อมูล
      </div>
    )
  }

  const chartHeight = Math.max(160, data.length * 40)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="code"
          tick={{ fontSize: 11, fill: "#374151" }}
          width={52}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="count"
          fill="#00AEEF"
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
