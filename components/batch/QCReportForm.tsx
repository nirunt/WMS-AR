"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card"

interface TemplateItem {
  testName: string
  unit?: string | null
  minValue?: number | null
  maxValue?: number | null
}

interface QCItem {
  id: string
  measuredValue?: number | null
  textResult?: string | null
  passFail?: string | null
  sortOrder: number
  templateItem: TemplateItem
}

interface QCReport {
  id: string
  notes?: string | null
  overallResult?: string | null
  signatureMeta?: unknown
}

interface QCReportFormProps {
  batchId: string
  initialReport: QCReport
  initialItems: QCItem[]
  productName: string
  batchNumber: string
}

export function QCReportForm({
  batchId,
  initialReport,
  initialItems,
  productName,
  batchNumber,
}: QCReportFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [signing, setSigning] = useState(false)
  const [showSignConfirm, setShowSignConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notes, setNotes] = useState(initialReport.notes ?? "")
  const [items, setItems] = useState<QCItem[]>(initialItems)

  const isSigned = !!initialReport.signatureMeta

  const updateItem = (
    id: string,
    field: keyof QCItem,
    value: string | number | null,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const allJudged = items.every((item) => !!item.passFail)
  const pendingCount = items.filter((item) => !item.passFail).length

  const buildItemsPayload = () =>
    items.map((item) => ({
      id: item.id,
      measuredValue: item.measuredValue ?? null,
      textResult: item.textResult ?? null,
      passFail: item.passFail ?? null,
    }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/batches/${batchId}/qc-report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: buildItemsPayload() }),
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
      const saveRes = await fetch(`/api/v1/batches/${batchId}/qc-report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: buildItemsPayload() }),
      })
      if (!saveRes.ok) throw new Error("บันทึกไม่สำเร็จ")

      const signRes = await fetch(`/api/v1/batches/${batchId}/qc-report/sign`, {
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
        <h1 className="text-2xl font-bold text-gray-900">รายงาน QC</h1>
        <p className="text-gray-500 text-sm">
          {batchNumber} &mdash; {productName}
        </p>
      </div>

      {isSigned && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-700">
            รายงานนี้ได้รับการลงนามอิเล็กทรอนิกส์แล้ว — ผลโดยรวม:{" "}
            <span
              className={`font-bold ${
                initialReport.overallResult === "PASS"
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {initialReport.overallResult}
            </span>
          </p>
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
          <CardTitle>ผลการทดสอบ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              ไม่มีรายการทดสอบ (สินค้านี้ยังไม่มี QC Template)
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      รายการทดสอบ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      เกณฑ์
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ค่าที่วัดได้
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ผลทดสอบ (ข้อความ)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ผ่าน/ไม่ผ่าน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const ti = item.templateItem
                    const criterion =
                      ti.minValue != null && ti.maxValue != null
                        ? `${ti.minValue}–${ti.maxValue} ${ti.unit ?? ""}`
                        : ti.minValue != null
                        ? `≥ ${ti.minValue} ${ti.unit ?? ""}`
                        : ti.maxValue != null
                        ? `≤ ${ti.maxValue} ${ti.unit ?? ""}`
                        : ""

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {ti.testName}
                          {ti.unit && (
                            <span className="text-gray-400 ml-1 text-xs">
                              ({ti.unit})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {criterion || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            disabled={isSigned}
                            value={item.measuredValue ?? ""}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "measuredValue",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            step="0.001"
                            className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003B73] disabled:opacity-50 disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            disabled={isSigned}
                            value={item.textResult ?? ""}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "textResult",
                                e.target.value || null,
                              )
                            }
                            placeholder="เช่น ไม่พบ / Positive"
                            className="w-36 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003B73] disabled:opacity-50 disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={isSigned}
                            value={item.passFail ?? ""}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "passFail",
                                e.target.value || null,
                              )
                            }
                            className={`rounded border px-2 py-1.5 text-sm font-semibold focus:outline-none disabled:opacity-50 disabled:bg-gray-50 ${
                              item.passFail === "PASS"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : item.passFail === "FAIL"
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-gray-300 bg-white text-gray-500"
                            }`}
                          >
                            <option value="">-- เลือก --</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมายเหตุ QC
          </label>
          <textarea
            disabled={isSigned}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="บันทึกข้อสังเกต ปัญหา หรือข้อมูลเพิ่มเติม..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73]/40 resize-none disabled:opacity-60 disabled:bg-gray-50"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 items-center">
        {!isSigned ? (
          <>
            <Button variant="outline" loading={saving} onClick={handleSave}>
              บันทึกร่าง
            </Button>
            <Button
              variant="primary"
              disabled={saving || signing || !allJudged}
              onClick={() => setShowSignConfirm(true)}
            >
              ลงนามและยืนยัน QC
            </Button>
            {!allJudged && (
              <span className="text-xs text-amber-600">
                ยังมี {pendingCount} รายการที่ยังไม่ได้ระบุผล
              </span>
            )}
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
              ยืนยันการลงนาม QC
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              ระบบจะคำนวณผลโดยรวมโดยอัตโนมัติ:
            </p>
            <ul className="text-sm text-gray-600 mb-3 list-disc ml-5 space-y-1">
              <li>ทุกรายการ PASS → ผลโดยรวม PASS</li>
              <li>มีอย่างน้อย 1 รายการ FAIL → ผลโดยรวม FAIL</li>
            </ul>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
              เมื่อลงนามแล้วจะ<strong>ไม่สามารถแก้ไข</strong>ผลการทดสอบได้อีก
            </div>
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
