"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/Button"

interface RevokeCOAButtonProps {
  coaId: string
  coaNumber: string
}

export function RevokeCOAButton({ coaId, coaNumber }: RevokeCOAButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRevoke = async () => {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/coas/${coaId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "ยกเลิกไม่สำเร็จ")
      }
      setShowModal(false)
      setReason("")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-xs text-red-500 hover:text-red-700 font-medium"
      >
        ยกเลิก COA
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">ยกเลิก COA</h3>
            <p className="text-sm text-gray-500 mb-4">
              COA เลขที่{" "}
              <span className="font-mono font-medium text-gray-700">{coaNumber}</span>
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลการยกเลิก (จำเป็น)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowModal(false)
                  setReason("")
                  setError(null)
                }}
              >
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={loading}
                disabled={!reason.trim()}
                onClick={handleRevoke}
              >
                ยืนยันการยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
