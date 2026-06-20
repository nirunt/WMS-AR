import type { NotificationService } from "./notification.interface"
import { ConsoleNotificationService } from "./console.notification"

export type { NotificationService }

export function getNotificationService(): NotificationService {
  const adapter = process.env.NOTIFICATION_ADAPTER ?? "console"
  switch (adapter) {
    case "console":
    default:
      return new ConsoleNotificationService()
  }
}

export const notificationService = getNotificationService()
