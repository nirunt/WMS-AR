import { prisma } from "@/lib/prisma"

interface AuditParams {
  entityType: string
  entityId: string
  action: string
  userId?: string
  userName?: string
  userRole?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  changedFields?: string[]
  ipAddress?: string
  userAgent?: string
}

export async function recordAudit(params: AuditParams) {
  return prisma.auditTrail.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
      newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
      changedFields: params.changedFields ?? [],
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

export function getChangedFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): string[] {
  const fields: string[] = []
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  for (const key of keys) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      fields.push(key)
    }
  }
  return fields
}
