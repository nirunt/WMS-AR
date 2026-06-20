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
import { useEffect } from "react"

const createBatchSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  productionDate: z.string().min(1, "กรุณาระบุวันที่ผลิต"),
  expiryDate: z.string().min(1, "กรุณาระบุวันหมดอายุ"),
  quantity: z.coerce.number().int().positive("จำนวนต้องเป็นบวก"),
  quantityUnit: z.string().min(1),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof createBatchSchema>

interface Product {
  id: string
  nameEn: string
  nameTh: string
  sku: string
  shelfLifeDays: number
}

export default function NewBatchPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: { quantityUnit: "units" },
  })

  const selectedProductId = watch("productId")
  const productionDate = watch("productionDate")

  useEffect(() => {
    fetch("/api/v1/products?activeOnly=true")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProductId || !productionDate) return
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return
    const expiry = new Date(productionDate)
    expiry.setDate(expiry.getDate() + product.shelfLifeDays)
    setValue("expiryDate", expiry.toISOString().split("T")[0])
  }, [selectedProductId, productionDate, products, setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "เกิดข้อผิดพลาด")
      }
      const { batch } = await res.json()
      router.push(`/batches/${batch.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.sku} — ${p.nameEn}`,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">สร้าง Batch ใหม่</h1>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการผลิต</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Select
              label="สินค้า"
              options={productOptions}
              placeholder="-- เลือกสินค้า --"
              required
              error={errors.productId?.message}
              {...register("productId")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="วันที่ผลิต"
                required
                error={errors.productionDate?.message}
                {...register("productionDate")}
              />
              <Input
                type="date"
                label="วันหมดอายุ"
                required
                error={errors.expiryDate?.message}
                {...register("expiryDate")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="จำนวน"
                required
                min={1}
                error={errors.quantity?.message}
                {...register("quantity")}
              />
              <Input
                label="หน่วย"
                defaultValue="units"
                error={errors.quantityUnit?.message}
                {...register("quantityUnit")}
              />
            </div>

            <Input
              label="หมายเหตุ"
              error={errors.notes?.message}
              {...register("notes")}
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                สร้าง Batch
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
