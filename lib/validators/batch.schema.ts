import { z } from "zod"

export const createBatchSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  manufacturingDate: z.string().min(1, "กรุณาระบุวันที่ผลิต"),
  quantityProduced: z.number().positive("จำนวนต้องมากกว่า 0"),
  quantityUnit: z.string().min(1, "กรุณาระบุหน่วย"),
  operatorId: z.string().min(1, "กรุณาระบุผู้ปฏิบัติงาน"),
  productionNotes: z.string().optional(),
})

export const updateBatchSchema = createBatchSchema.partial()

export const rawMaterialSchema = z.object({
  materialName: z.string().min(1, "กรุณาระบุชื่อวัตถุดิบ"),
  lotNumber: z.string().optional(),
  supplier: z.string().optional(),
  quantityUsed: z.number().positive("จำนวนต้องมากกว่า 0"),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  notes: z.string().optional(),
})

export const batchReportSchema = z.object({
  productionStart: z.string().optional(),
  productionEnd: z.string().optional(),
  equipmentUsed: z.array(z.string()).default([]),
  processChecklist: z
    .array(
      z.object({
        item: z.string(),
        isChecked: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .default([]),
  deviationReport: z.string().optional(),
})

export const signatureSchema = z.object({
  fullName: z.string().min(2, "กรุณาพิมพ์ชื่อ-นามสกุลเต็ม"),
})

export type CreateBatchInput = z.infer<typeof createBatchSchema>
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>
export type RawMaterialInput = z.infer<typeof rawMaterialSchema>
export type BatchReportInput = z.infer<typeof batchReportSchema>
export type SignatureInput = z.infer<typeof signatureSchema>
