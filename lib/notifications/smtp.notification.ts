import type { NotificationService, BatchInfo, NotificationUser } from "./notification.interface"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

function buildEmailHtml(title: string, body: string, batchNumber: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<body style="font-family: Arial, Helvetica, sans-serif; color: #333; margin: 0; padding: 0; background: #f8fafc;">
  <div style="max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08);">
    <div style="background: #003B73; padding: 20px 28px;">
      <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600; letter-spacing: .5px;">U&amp;V Holding (Thailand) Co., Ltd.</p>
      <p style="margin: 4px 0 0; color: #00AEEF; font-size: 12px;">LIMS Notification</p>
    </div>
    <div style="padding: 28px;">
      <h2 style="margin: 0 0 12px; color: #003B73; font-size: 16px;">${title}</h2>
      <p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">${body}</p>
      <div style="background: #f0f7ff; border-left: 3px solid #00AEEF; border-radius: 4px; padding: 10px 14px; display: inline-block;">
        <span style="font-size: 12px; color: #666;">Batch: </span>
        <span style="font-size: 13px; font-weight: 700; color: #003B73;">${batchNumber}</span>
      </div>
    </div>
    <div style="padding: 16px 28px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">ระบบนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
    </div>
  </div>
</body>
</html>`
}

export class SmtpNotificationService implements NotificationService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  private readonly from = process.env.SMTP_FROM ?? "noreply@uvholding.com"

  private async persist(
    users: NotificationUser[],
    type: string,
    title: string,
    message: string,
    entityId: string
  ) {
    for (const user of users) {
      await prisma.notification.create({
        data: { userId: user.id, type, title, message, entityType: "batch", entityId },
      })
    }
  }

  private async sendMails(
    recipients: NotificationUser[],
    subject: string,
    body: string,
    batchNumber: string
  ) {
    const html = buildEmailHtml(subject, body, batchNumber)
    await Promise.allSettled(
      recipients.map((u) =>
        this.transporter
          .sendMail({ from: this.from, to: u.email, subject, html })
          .catch((e) =>
            console.error(`[SMTP] failed to deliver to ${u.email}:`, (e as Error).message)
          )
      )
    )
  }

  async batchSubmittedForQC(batch: BatchInfo, qcOfficers: NotificationUser[]) {
    const title = `Batch ${batch.batchNumber} รอการตรวจสอบ QC`
    const message = `Batch ${batch.batchNumber} (${batch.productNameTh}) ถูกส่งเพื่อตรวจสอบคุณภาพ`
    await this.persist(qcOfficers, "BATCH_SUBMITTED_FOR_QC", title, message, batch.id)
    await this.sendMails(qcOfficers, title, message, batch.batchNumber)
  }

  async qcApproved(batch: BatchInfo, managers: NotificationUser[]) {
    const title = `QC อนุมัติ Batch ${batch.batchNumber}`
    const message = `Batch ${batch.batchNumber} ผ่าน QC และรออนุมัติจากผู้จัดการ`
    await this.persist(managers, "QC_APPROVED", title, message, batch.id)
    await this.sendMails(managers, title, message, batch.batchNumber)
  }

  async qcRejected(batch: BatchInfo, operator: NotificationUser, reason: string) {
    const title = `QC ปฏิเสธ Batch ${batch.batchNumber}`
    const message = `Batch ${batch.batchNumber} ไม่ผ่าน QC: ${reason}`
    await this.persist([operator], "QC_REJECTED", title, message, batch.id)
    await this.sendMails([operator], title, message, batch.batchNumber)
  }

  async managerApprovalNeeded(batch: BatchInfo, managers: NotificationUser[]) {
    const title = `รออนุมัติ Batch ${batch.batchNumber}`
    const message = `Batch ${batch.batchNumber} รอการอนุมัติจากผู้จัดการ`
    await this.persist(managers, "MANAGER_APPROVAL_NEEDED", title, message, batch.id)
    await this.sendMails(managers, title, message, batch.batchNumber)
  }

  async batchReleased(batch: BatchInfo, stakeholders: NotificationUser[]) {
    const title = `Batch ${batch.batchNumber} ปล่อยจำหน่ายแล้ว`
    const message = `Batch ${batch.batchNumber} (${batch.productNameTh}) ได้รับการอนุมัติและปล่อยจำหน่ายแล้ว`
    await this.persist(stakeholders, "BATCH_RELEASED", title, message, batch.id)
    await this.sendMails(stakeholders, title, message, batch.batchNumber)
  }
}
