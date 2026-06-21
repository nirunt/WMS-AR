import type { NotificationService } from "./notification.interface"
import { ConsoleNotificationService } from "./console.notification"
import { SmtpNotificationService } from "./smtp.notification"

export type { NotificationService }

export function getNotificationService(): NotificationService {
  if (process.env.NOTIFICATION_ADAPTER === "smtp") {
    return new SmtpNotificationService()
  }
  return new ConsoleNotificationService()
}

export const notificationService = getNotificationService()
