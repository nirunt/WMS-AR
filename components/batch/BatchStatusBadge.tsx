import { BatchStatus } from "@/lib/db"
import { BATCH_STATUS_COLORS, BATCH_STATUS_LABELS, cn } from "@/lib/utils"

interface BatchStatusBadgeProps {
  status: BatchStatus
  className?: string
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        BATCH_STATUS_COLORS[status],
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {BATCH_STATUS_LABELS[status]}
    </span>
  )
}
