"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TrendData {
  date: string
  count: number
}

export function BatchTrendChart({ data }: { data: TrendData[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }))

  if (!mounted) {
    return <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 16, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          interval={4}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value} batch`, "จำนวน"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#003B73"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#00AEEF" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
