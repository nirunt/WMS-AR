"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BatchStatus, UserRole } from "@/lib/db"
import { Button } from "@/components/shared/Button"
import Link from "next/link"

interface WorkflowActionsProps {
  batchId: string
  status: BatchStatus
  userRole: UserRole
  userId: string
  createdById: string
  hasBatchReport: boolean
  batchReportSigned: boolean
  hasQCReport: boolean
  qcReportSigned: boolean
}

export function WorkflowActions({
  batchId,
  status,
  userRole,
  userId,
  createdById,
  hasBatchReport,
  batchReportSigned,
  hasQCReport,
  qcReportSigned,
}: WorkflowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const [rejectType, setRejectType] = useState<"qc" | "manager">("qc")
  const [apiError, setApiError] = useState<string | null>(null)

  const callAction = async (endpoint: string, body?: object) => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch(`/api/v1/batches/${batchId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error ?? "เกิดข้อผิดพลาด")
        return
      }
      router.refresh()
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return
    await callAction(rejectType === "qc" ? "qc-reject" : "reject", { comment: rejectComment })
    setShowRejectModal(false)
    setRejectComment("")
  }

  const isOwner = userId === createdById
  const isProduction = userRole === UserRole.PRODUCTION || userRole === UserRole.ADMIN
  const isQC = userRole === UserRole.QC || userRole === UserRole.ADMIN
  const isManager = userRole === UserRole.MANAGER || userRole === UserRole.ADMIN

  const canEditBatch = isProduction && (isOwner || userRole === UserRole.ADMIN)
  const isDraftOrComplete =
    status === BatchStatus.DRAFT || status === BatchStatus.PRODUCTION_COMPLETE

  if (
    !(
      (isDraftOrComplete && canEditBatch) ||
      (status === BatchStatus.QC_PENDING && isQC) ||
      (status === BatchStatus.PENDING_MANAGER_APPROVAL && isManager)
    )
  ) {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {apiError && (
          <span className="w-full text-xs text-red-600">{apiError}</span>
        )}

        {isDraftOrComplete && canEditBatch && (
          <Link href={`/batches/${batchId}/report`}>
            <Button variant="outline" size="sm">
              {hasBatchReport ? "แก้ไขรายงานการผลิต" : "บันทึกรายงานการผลิต"}
            </Button>
          </Link>
        )}

        {isDraftOrComplete && canEditBatch && batchReportSigned && (
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={() => callAction("submit")}
          >
            ส่งตรวจ QC
          </Button>
        )}

        {status === BatchStatus.QC_PENDING && isQC && (
          <Link href={`/batches/${batchId}/qc-report`}>
            <Button variant="outline" size="sm">
              {hasQCReport ? "แก้ไขรายงาน QC" : "บันทึกผล QC"}
            </Button>
          </Link>
        )}

        {status === BatchStatus.QC_PENDING && isQC && qcReportSigned && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => callAction("qc-approve")}
            >
              ผ่าน QC
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={loading}
              onClick={() => {
                setRejectType("qc")
                setShowRejectModal(true)
              }}
            >
              ไม่ผ่าน QC
            </Button>
          </>
        )}

        {status === BatchStatus.PENDING_MANAGER_APPROVAL && isManager && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => callAction("approve")}
            >
              อนุมัติ &amp; ออก COA
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={loading}
              onClick={() => {
                setRejectType("manager")
                setShowRejectModal(true)
              }}
            >
              ปฏิเสธ
            </Button>
          </>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {rejectType === "qc" ? "ไม่ผ่าน QC" : "ปฏิเสธ Batch"}
            </h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="ระบุเหตุผล (จำเป็น)"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectComment("")
                }}
              >
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={loading}
                disabled={!rejectComment.trim()}
                onClick={handleReject}
              >
                ยืนยันการปฏิเสธ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
