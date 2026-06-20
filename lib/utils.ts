import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BatchStatus, QCResult, PassFail } from "@/lib/db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale = "th-TH"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string, locale = "th-TH"): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  DRAFT: "ร่าง",
  PRODUCTION_COMPLETE: "ผลิตเสร็จ",
  QC_PENDING: "รอ QC",
  QC_APPROVED: "QC อนุมัติ",
  QC_REJECTED: "QC ปฏิเสธ",
  PENDING_MANAGER_APPROVAL: "รออนุมัติผู้จัดการ",
  RELEASED: "ปล่อยจำหน่าย",
  REJECTED: "ปฏิเสธ",
  ARCHIVED: "เก็บถาวร",
}

export const BATCH_STATUS_LABELS_EN: Record<BatchStatus, string> = {
  DRAFT: "Draft",
  PRODUCTION_COMPLETE: "Production Complete",
  QC_PENDING: "QC Pending",
  QC_APPROVED: "QC Approved",
  QC_REJECTED: "QC Rejected",
  PENDING_MANAGER_APPROVAL: "Pending Manager Approval",
  RELEASED: "Released",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
}

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PRODUCTION_COMPLETE: "bg-blue-100 text-blue-700 border-blue-200",
  QC_PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  QC_APPROVED: "bg-teal-100 text-teal-700 border-teal-200",
  QC_REJECTED: "bg-red-100 text-red-700 border-red-200",
  PENDING_MANAGER_APPROVAL: "bg-orange-100 text-orange-700 border-orange-200",
  RELEASED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-400 border-gray-200",
}

export const QC_RESULT_LABELS: Record<QCResult, string> = {
  PASS: "ผ่าน",
  FAIL: "ไม่ผ่าน",
  PENDING: "รอดำเนินการ",
}

export const PASS_FAIL_LABELS: Record<PassFail, string> = {
  PASS: "ผ่าน",
  FAIL: "ไม่ผ่าน",
  NA: "N/A",
}
