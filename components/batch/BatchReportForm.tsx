"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/shared/Input"
import { Button } from "@/components/shared/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"

interface BatchReport {
  id: string
  productionNotes?: string | null
  equipmentUsed?: string | null
  environmentTemp?: number | null
  environmentHumidity?: number | null
  signatureMeta?: unknown
  signedAt?: string | null
}

interface BatchReportFormProps {
  batchId: string
  initialReport?: BatchReport | null
  productName: string
  batchNumber: string
}

export function BatchReportForm({
  batchId,
  initialReport,
  productName,
  batchNumber,
}: BatchReportFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [signing, setSigning] = useState(false)
  const [showSignConfirm, setShowSignConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    productionNotes: initialReport?.productionNotes ?? "",
    equipmentUsed: initialReport?.equipmentUsed ?? "",
    environmentTemp: initialReport?.environmentTemp?.toString() ?? "",
    environmentHumidity: initialReport?.environmentHumidity?.toString() ?? "",
  })

  const isSigned = !!initialReport?.signatureMeta

  const buildBody = () => ({
    productionNotes: form.productionNotes || null,
    equipmentUsed: form.equipmentUsed || null,
    environmentTemp: form.environmentTemp ? Number(form.environmentTemp) : null,
    environmentHumidity: form.environmentHumidity ? Number(form.environmentHumidity) : null,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/batches/${batchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "เกิดข้อผิดพลาด")
      }
      setSuccess("บันทึกเรียบร้อยแล้ว")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  const handleSign = async () => {
    setSigning(true)
    setError(null)
    setShowSignConfirm(false)
    try {
      const saveRes = await fetch(`/api/v1/batches/${batchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      })
      if (!saveRes.ok) throw new Error("บันทึกไม่สำเร็จ")

      const signRes = await fetch(`/api/v1/batches/${batchId}/report/sign`, {
        method: "POST",
      })
      if (!signRes.ok) {
        const data = await signRes.json()
        throw new Error(data.error ?? "ลงนามไม่สำเร็จ")
      }
      router.push(`/batches/${batchId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1">
          <button
            type="button"
            onClick={() => router.push(`/batches/${batchId}`)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; กลับ
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">รายงานการผลิต</h1>
        <p className="text-gray-500 text-sm">
          {batchNumber} &mdash; {productName}
        </p>
      </div>

      {isSigned && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          รายงานนี้ได้รับการลงนามอิเล็กทรอนิกส์แล้ว ไม่สามารถแก้ไขได้
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการผลิต</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุการผลิต
            </label>
            <textarea
              disabled={isSigned}
              value={form.productionNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, productionNotes: e.target.value }))
              }
              rows={5}
              placeholder="บันทึกรายละเอียดขั้นตอนการผลิต เช่น การผสม, การบรรจุ, ปัญหาที่พบ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73]/40 focus:border-[#003B73] resize-none disabled:opacity-60 disabled:bg-gray-50"
            />
          </div>

          <Input
            label="อุปกรณ์ที่ใช้"
            disabled={isSigned}
            value={form.equipmentUsed}
            onChange={(e) =>
              setForm((f) => ({ ...f, equipmentUsed: e.target.value }))
            }
            placeholder="เช่น เครื่องผสม A-01, เตาอบ B-02"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="อุณหภูมิสภาพแวดล้อม (°C)"
              disabled={isSigned}
              value={form.environmentTemp}
              onChange={(e) =>
                setForm((f) => ({ ...f, environmentTemp: e.target.value }))
              }
              placeholder="25.0"
              step="0.1"
            />
            <Input
              type="number"
              label="ความชื้นสัมพัทธ์ (%RH)"
              disabled={isSigned}
              value={form.environmentHumidity}
              onChange={(e) =>
                setForm((f) => ({ ...f, environmentHumidity: e.target.value }))
              }
              placeholder="60.0"
              step="0.1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {!isSigned ? (
          <>
            <Button variant="outline" loading={saving} onClick={handleSave}>
              บันทึกร่าง
            </Button>
            <Button
              variant="primary"
              disabled={saving || signing}
              onClick={() => setShowSignConfirm(true)}
            >
              ลงนามและยืนยัน
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(`/batches/${batchId}`)}
            >
              ยกเลิก
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={() => router.push(`/batches/${batchId}`)}
          >
            กลับไปหน้า Batch
          </Button>
        )}
      </div>

      {showSignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ยืนยันการลงนามอิเล็กทรอนิกส์
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ระบบจะบันทึกข้อมูลการลงนาม ได้แก่ ชื่อ-นามสกุล,
              วันเวลา, และ IP Address ของคุณ
              เมื่อลงนามแล้วข้อมูลในรายงานจะ<strong>ไม่สามารถแก้ไขได้อีก</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignConfirm(false)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={signing}
                onClick={handleSign}
              >
                ยืนยันลงนาม
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
