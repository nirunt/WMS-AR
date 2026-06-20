import type { NotificationService, BatchInfo, NotificationUser } from "./notification.interface"
import { prisma } from "@/lib/prisma"

export class ConsoleNotificationService implements NotificationService {
  private async persist(
    users: NotificationUser[],
    type: string,
    title: string,
    message: string,
    entityId: string
  ) {
    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          title,
          message,
          entityType: "batch",
          entityId,
        },
      })
    }
    console.log(`[Notification:${type}]`, { title, message, recipients: users.map(u => u.email) })
  }

  async batchSubmittedForQC(batch: BatchInfo, qcOfficers: NotificationUser[]) {
    await this.persist(
      qcOfficers,
      "BATCH_SUBMITTED_FOR_QC",
      `Batch ${batch.batchNumber} รอการตรวจสอบ QC`,
      `Batch ${batch.batchNumber} (${batch.productNameTh}) ถูกส่งเพื่อตรวจสอบคุณภาพ`,
      batch.id
    )
  }

  async qcApproved(batch: BatchInfo, managers: NotificationUser[]) {
    await this.persist(
      managers,
      "QC_APPROVED",
      `QC อนุมัติ Batch ${batch.batchNumber}`,
      `Batch ${batch.batchNumber} ผ่าน QC และรออนุมัติจากผู้จัดการ`,
      batch.id
    )
  }

  async qcRejected(batch: BatchInfo, operator: NotificationUser, reason: string) {
    await this.persist(
      [operator],
      "QC_REJECTED",
      `QC ปฏิเสธ Batch ${batch.batchNumber}`,
      `Batch ${batch.batchNumber} ไม่ผ่าน QC: ${reason}`,
      batch.id
    )
  }

  async managerApprovalNeeded(batch: BatchInfo, managers: NotificationUser[]) {
    await this.persist(
      managers,
      "MANAGER_APPROVAL_NEEDED",
      `รออนุมัติ Batch ${batch.batchNumber}`,
      `Batch ${batch.batchNumber} รอการอนุมัติจากผู้จัดการ`,
      batch.id
    )
  }

  async batchReleased(batch: BatchInfo, stakeholders: NotificationUser[]) {
    await this.persist(
      stakeholders,
      "BATCH_RELEASED",
      `Batch ${batch.batchNumber} ปล่อยจำหน่ายแล้ว`,
      `Batch ${batch.batchNumber} (${batch.productNameTh}) ได้รับการอนุมัติและปล่อยจำหน่ายแล้ว`,
      batch.id
    )
  }
}
