import type { NotificationService } from "./notification.interface"
import { ConsoleNotificationService } from "./console.notification"

export type { NotificationService }

export function getNotificationService(): NotificationService {
  if (process.env.NOTIFICATION_ADAPTER === "smtp") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SmtpNotificationService } = require("./smtp.notification") as typeof import("./smtp.notification")
    return new SmtpNotificationService()
  }
  return new ConsoleNotificationService()
}

export const notificationService = getNotificationService()
