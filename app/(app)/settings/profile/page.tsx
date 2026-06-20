"use client"

import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { Input } from "@/components/shared/Input"
import { Button } from "@/components/shared/Button"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณาระบุรหัสผ่านปัจจุบัน"),
    newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof changePasswordSchema>

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/v1/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "เกิดข้อผิดพลาด")
      }
      setMessage({ type: "success", text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" })
      reset()
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>

      <Card>
        <CardHeader><CardTitle>ข้อมูลผู้ใช้</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">ชื่อ-นามสกุล</dt>
              <dd className="text-sm font-medium">{session?.user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">อีเมล</dt>
              <dd className="text-sm">{session?.user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">บทบาท</dt>
              <dd className="text-sm">{session?.user?.role}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>เปลี่ยนรหัสผ่าน</CardTitle></CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="password"
              label="รหัสผ่านปัจจุบัน"
              required
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <Input
              type="password"
              label="รหัสผ่านใหม่"
              required
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Input
              type="password"
              label="ยืนยันรหัสผ่านใหม่"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" loading={loading}>
              เปลี่ยนรหัสผ่าน
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
