"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/shared/Input"
import { Select } from "@/components/shared/Select"
import { Button } from "@/components/shared/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"

const schema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  role: z.enum(["ADMIN", "PRODUCTION", "QC", "MANAGER"]),
  department: z.string().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "PRODUCTION", label: "ผลิต" },
  { value: "QC", label: "QC" },
  { value: "MANAGER", label: "ผู้จัดการ" },
]

interface UserProps {
  id: string
  name: string
  email: string
  role: string
  department: string | null
  isActive: boolean
}

export function EditUserForm({ user }: { user: UserProps }) {
  const router = useRouter()
  const [saveError, setSaveError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      role: user.role as FormValues["role"],
      department: user.department ?? "",
      isActive: user.isActive,
    },
  })

  async function onSubmit(values: FormValues) {
    setSaveError("")
    const res = await fetch(`/api/v1/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      router.push("/settings/users")
      router.refresh()
    } else {
      const data = await res.json() as { error?: string }
      setSaveError(data.error ?? "เกิดข้อผิดพลาด")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-gray-600">{user.email}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="ชื่อ-นามสกุล"
            {...register("name")}
            error={errors.name?.message}
          />

          <Select
            label="บทบาท"
            options={ROLE_OPTIONS}
            {...register("role")}
            error={errors.role?.message}
          />

          <Input
            label="แผนก (ถ้ามี)"
            placeholder="เช่น ฝ่ายผลิต"
            {...register("department")}
          />

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">สถานะบัญชี</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-[#003B73] focus:ring-[#003B73]"
                {...register("isActive")}
              />
              <span className="text-sm text-gray-700">เปิดใช้งาน</span>
            </label>
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={isSubmitting}>
              บันทึก
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/settings/users")}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
