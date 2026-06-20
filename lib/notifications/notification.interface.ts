export interface NotificationUser {
  id: string
  name: string
  email: string
}

export interface BatchInfo {
  id: string
  batchNumber: string
  productNameTh: string
  productNameEn: string
}

export interface NotificationService {
  batchSubmittedForQC(batch: BatchInfo, qcOfficers: NotificationUser[]): Promise<void>
  qcApproved(batch: BatchInfo, managers: NotificationUser[]): Promise<void>
  qcRejected(batch: BatchInfo, operator: NotificationUser, reason: string): Promise<void>
  managerApprovalNeeded(batch: BatchInfo, managers: NotificationUser[]): Promise<void>
  batchReleased(batch: BatchInfo, stakeholders: NotificationUser[]): Promise<void>
}
