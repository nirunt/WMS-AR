import { z } from "zod"

export const productSchema = z.object({
  productCode: z
    .string()
    .min(1, "กรุณาระบุรหัสสินค้า")
    .regex(/^[\w\-]+$/, "รหัสสินค้าใช้ได้เฉพาะตัวอักษร ตัวเลข และเครื่องหมาย -"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อสินค้าภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อสินค้าภาษาอังกฤษ"),
  category: z.string().optional(),
  shelfLifeDays: z.number().int().positive("อายุการเก็บรักษาต้องมากกว่า 0"),
  storageCondition: z.string().optional(),
  qcTemplateId: z.string().optional(),
  specTemplate: z
    .array(z.object({ item: z.string(), orderIndex: z.number().default(0) }))
    .optional(),
  isActive: z.boolean().default(true),
})

export const qcTemplateSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ Template"),
  productId: z.string().optional(),
  items: z.array(
    z.object({
      testItem: z.string().min(1),
      specification: z.string().min(1),
      unit: z.string().optional(),
      orderIndex: z.number().default(0),
    })
  ),
})

export type ProductInput = z.infer<typeof productSchema>
export type QCTemplateInput = z.infer<typeof qcTemplateSchema>
