"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"
import { Input } from "@/components/shared/Input"
import { Button } from "@/components/shared/Button"
import { Package, ChevronLeft } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  productCode: z
    .string()
    .min(1, "กรุณาระบุรหัสสินค้า")
    .regex(/^[\w\-]+$/, "ใช้ได้เฉพาะตัวอักษร ตัวเลข และ -"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อภาษาอังกฤษ"),
  category: z.string().optional(),
  shelfLifeDays: z.coerce.number().int().positive("ต้องมากกว่า 0"),
  storageCondition: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { shelfLifeDays: 365 },
  })

  async function onSubmit(values: FormValues) {
    setError("")
    const res = await fetch("/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, isActive: true }),
    })
    if (res.ok) {
      router.push("/products")
      router.refresh()
    } else {
      const data = await res.json() as { error?: string }
      setError(typeof data.error === "string" ? data.error : "เกิดข้อผิดพลาด")
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003B73] mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          กลับ
        </Link>
        <h1 className="text-xl font-bold text-[#003B73] flex items-center gap-2">
          <Package className="w-5 h-5" />
          เพิ่มสินค้าใหม่
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="รหัสสินค้า"
              placeholder="เช่น 90-10"
              {...register("productCode")}
              error={errors.productCode?.message}
            />

            <Input
              label="ชื่อสินค้า (ภาษาไทย)"
              placeholder="เช่น ชุดทดสอบ E.coli"
              {...register("nameTh")}
              error={errors.nameTh?.message}
            />

            <Input
              label="ชื่อสินค้า (English)"
              placeholder="e.g. E.coli Rapid Test Kit"
              {...register("nameEn")}
              error={errors.nameEn?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="หมวดหมู่"
                placeholder="เช่น Food Safety"
                {...register("category")}
              />
              <Input
                label="อายุการเก็บรักษา (วัน)"
                type="number"
                min={1}
                {...register("shelfLifeDays")}
                error={errors.shelfLifeDays?.message}
              />
            </div>

            <Input
              label="เงื่อนไขการเก็บรักษา"
              placeholder="เช่น เก็บในที่แห้ง อุณหภูมิ 15–30°C"
              {...register("storageCondition")}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting}>
                บันทึก
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/products")}
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
