import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"
import { UserRole } from "../app/generated/prisma/enums"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PRODUCTS = [
  { code: "90-01", nameTh: "Swab Test", nameEn: "Swab Test", shelfLifeDays: 180 },
  { code: "90-02", nameTh: "SI-2 Coliform Screening Test", nameEn: "SI-2 Coliform Screening Test", shelfLifeDays: 365 },
  { code: "90-03", nameTh: "MJPK Pesticide Test", nameEn: "MJPK Pesticide Test", shelfLifeDays: 365 },
  { code: "90-04", nameTh: "Formalin Test", nameEn: "Formalin Test", shelfLifeDays: 365 },
  { code: "90-05", nameTh: "Polar Test", nameEn: "Polar Test", shelfLifeDays: 365 },
  { code: "90-07", nameTh: "Synthetic Color Test", nameEn: "Synthetic Color Test", shelfLifeDays: 365 },
  { code: "90-08", nameTh: "E.coli Test", nameEn: "E.coli Test", shelfLifeDays: 365 },
  { code: "90-09", nameTh: "Coliform Quantitative Test", nameEn: "Coliform Quantitative Test", shelfLifeDays: 365 },
]

const DEFAULT_CHECKLIST = [
  { item: "ตรวจสอบ lot วัตถุดิบกับ BOM", orderIndex: 0 },
  { item: "ตรวจสอบอุณหภูมิห้องสะอาด ≤ 25°C", orderIndex: 1 },
  { item: "สอบเทียบ pH meter", orderIndex: 2 },
  { item: "แนบ log เครื่อง autoclave", orderIndex: 3 },
  { item: "ตรวจสอบความสมบูรณ์ของบรรจุภัณฑ์", orderIndex: 4 },
]

async function main() {
  console.log("🌱 Seeding database...")

  const adminHash = await bcrypt.hash("Admin@1234", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@uvholding.com" },
    update: {},
    create: {
      email: "admin@uvholding.com",
      name: "ผู้ดูแลระบบ",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      department: "IT",
    },
  })
  console.log("✅ Admin user:", admin.email)

  const productionHash = await bcrypt.hash("Production@1234", 12)
  await prisma.user.upsert({
    where: { email: "production@uvholding.com" },
    update: {},
    create: {
      email: "production@uvholding.com",
      name: "สมชาย ใจดี",
      passwordHash: productionHash,
      role: UserRole.PRODUCTION,
      department: "ฝ่ายผลิต",
    },
  })

  const qcHash = await bcrypt.hash("QC@1234", 12)
  await prisma.user.upsert({
    where: { email: "qc@uvholding.com" },
    update: {},
    create: {
      email: "qc@uvholding.com",
      name: "นภา สุขสันต์",
      passwordHash: qcHash,
      role: UserRole.QC,
      department: "ฝ่าย QC",
    },
  })

  const managerHash = await bcrypt.hash("Manager@1234", 12)
  await prisma.user.upsert({
    where: { email: "manager@uvholding.com" },
    update: {},
    create: {
      email: "manager@uvholding.com",
      name: "วิชัย รักษาดี",
      passwordHash: managerHash,
      role: UserRole.MANAGER,
      department: "ฝ่ายบริหาร",
    },
  })

  console.log("✅ Sample users created")

  for (const p of PRODUCTS) {
    const existingTemplate = await prisma.qCTemplate.findFirst({
      where: { name: `${p.code} Standard QC v1`, deletedAt: null },
    })

    let template = existingTemplate
    if (!template) {
      template = await prisma.qCTemplate.create({
        data: {
          name: `${p.code} Standard QC v1`,
          createdBy: admin.id,
          items: {
            create: [
              { testItem: "ลักษณะภายนอก", specification: "ตามมาตรฐาน", unit: "—", orderIndex: 0 },
              { testItem: "สี", specification: "ตามมาตรฐาน", unit: "—", orderIndex: 1 },
              { testItem: "pH (25°C)", specification: "6.5 – 7.5", unit: "—", orderIndex: 2 },
              { testItem: "ปริมาตรต่อหลอด", specification: "5.0 ± 0.1", unit: "mL", orderIndex: 3 },
              { testItem: "ความสมบูรณ์ของฉลาก", specification: "ผ่าน", unit: "—", orderIndex: 4 },
            ],
          },
        },
      })
    }

    await prisma.productMaster.upsert({
      where: { productCode: p.code },
      update: {},
      create: {
        productCode: p.code,
        nameTh: p.nameTh,
        nameEn: p.nameEn,
        category: "Food Safety Test Kit",
        shelfLifeDays: p.shelfLifeDays,
        storageCondition: "เก็บที่อุณหภูมิ 2–8°C หลีกเลี่ยงแสงแดด",
        specTemplate: DEFAULT_CHECKLIST,
        qcTemplateId: template.id,
        createdBy: admin.id,
      },
    })
  }
  console.log("✅ Products seeded:", PRODUCTS.length, "products")

  console.log("\n🎉 Seed complete!")
  console.log("\n📋 Login credentials:")
  console.log("  Admin:      admin@uvholding.com      / Admin@1234")
  console.log("  Production: production@uvholding.com / Production@1234")
  console.log("  QC:         qc@uvholding.com         / QC@1234")
  console.log("  Manager:    manager@uvholding.com    / Manager@1234")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
