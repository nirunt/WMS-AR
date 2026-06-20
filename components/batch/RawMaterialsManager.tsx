"use client"

import { useState } from "react"
import { Button } from "@/components/shared/Button"
import { Input } from "@/components/shared/Input"

interface RawMaterial {
  id: string
  materialName: string
  certificateNumber?: string | null
  lotNumber?: string | null
  quantity?: number | null
  unit?: string | null
  supplier?: string | null
  expiryDate?: string | null
}

interface RawMaterialsManagerProps {
  batchId: string
  initialMaterials: RawMaterial[]
  readonly?: boolean
}

const emptyForm = {
  materialName: "",
  certificateNumber: "",
  lotNumber: "",
  quantity: "",
  unit: "",
  supplier: "",
  expiryDate: "",
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function RawMaterialsManager({
  batchId,
  initialMaterials,
  readonly = false,
}: RawMaterialsManagerProps) {
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!form.materialName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/batches/${batchId}/raw-materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialName: form.materialName.trim(),
          certificateNumber: form.certificateNumber || null,
          lotNumber: form.lotNumber || null,
          quantity: form.quantity ? Number(form.quantity) : null,
          unit: form.unit || null,
          supplier: form.supplier || null,
          expiryDate: form.expiryDate || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "เกิดข้อผิดพลาด")
      }
      const { material } = await res.json()
      setMaterials((prev) => [
        ...prev,
        {
          ...material,
          expiryDate: material.expiryDate
            ? new Date(material.expiryDate).toISOString()
            : null,
        },
      ])
      setForm(emptyForm)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ลบรายการวัตถุดิบนี้?")) return
    try {
      const res = await fetch(
        `/api/v1/batches/${batchId}/raw-materials/${id}`,
        { method: "DELETE" },
      )
      if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch {
      alert("ลบไม่สำเร็จ")
    }
  }

  return (
    <div>
      {materials.length > 0 && (
        <div className="overflow-x-auto mb-3">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["ชื่อวัตถุดิบ", "เลขใบแจ้ง", "Lot", "จำนวน", "วันหมดอายุ", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((rm) => (
                <tr key={rm.id}>
                  <td className="px-3 py-2 text-sm font-medium">
                    {rm.materialName}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-500">
                    {rm.certificateNumber || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-500">
                    {rm.lotNumber || "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {rm.quantity != null
                      ? `${rm.quantity}${rm.unit ? ` ${rm.unit}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {formatDisplayDate(rm.expiryDate)}
                  </td>
                  <td className="px-3 py-2">
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(rm.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ลบ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {materials.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-1 mb-3">ยังไม่มีวัตถุดิบ</p>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {!readonly && (
        <>
          {showForm ? (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">เพิ่มวัตถุดิบ</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ชื่อวัตถุดิบ"
                  required
                  value={form.materialName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, materialName: e.target.value }))
                  }
                />
                <Input
                  label="ผู้จัดจำหน่าย"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
                <Input
                  label="เลขใบแจ้ง / ใบรับรอง"
                  value={form.certificateNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      certificateNumber: e.target.value,
                    }))
                  }
                />
                <Input
                  label="เลข Lot"
                  value={form.lotNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lotNumber: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  label="จำนวน"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
                <Input
                  label="หน่วย"
                  placeholder="kg, L, unit..."
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                />
                <div className="col-span-2">
                  <Input
                    type="date"
                    label="วันหมดอายุ"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiryDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={saving} onClick={handleAdd}>
                  เพิ่ม
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false)
                    setForm(emptyForm)
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              leftIcon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              เพิ่มวัตถุดิบ
            </Button>
          )}
        </>
      )}
    </div>
  )
}
