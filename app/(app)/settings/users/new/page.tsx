"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { Input } from "@/components/shared/Input"
import { Select } from "@/components/shared/Select"
import { Button } from "@/components/shared/Button"

const schema = z.object({
  fullName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  role: z.string().min(1, "กรุณาเลือกบทบาท"),
})

type FormData = z.infer<typeof schema>

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "เกิดข้อผิดพลาด")
      }
      router.push("/settings/users")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          &larr; กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900">เพิ่มผู้ใช้ใหม่</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="ชื่อ-นามสกุล"
              required
              placeholder="สมชาย ใจดี"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <Input
              type="email"
              label="อีเมล"
              required
              placeholder="user@uandvholding.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              type="password"
              label="รหัสผ่านเริ่มต้น"
              required
              error={errors.password?.message}
              hint="อย่างน้อย 8 ตัวอักษร"
              {...register("password")}
            />
            <Select
              label="บทบาท"
              required
              placeholder="-- เลือกบทบาท --"
              options={[
                { value: "PRODUCTION", label: "ฝ่ายผลิต" },
                { value: "QC", label: "ฝ่าย QC" },
                { value: "MANAGER", label: "ผู้จัดการ" },
                { value: "ADMIN", label: "ผู้ดูแลระบบ" },
              ]}
              error={errors.role?.message}
              {...register("role")}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                เพิ่มผู้ใช้
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
