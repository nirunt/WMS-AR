import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { sku: "asc" },
    include: { qcTemplate: { select: { name: true } } },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">รายการสินค้า</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                <Badge variant={product.isActive ? "success" : "gray"}>
                  {product.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{product.nameEn}</h3>
              {product.nameTh && (
                <p className="text-sm text-gray-500 mb-2">{product.nameTh}</p>
              )}
              <div className="space-y-1 text-xs text-gray-500">
                <p>อายุการเก็บ: {product.shelfLifeDays} วัน</p>
                {product.qcTemplate && (
                  <p>แบบ QC: {product.qcTemplate.name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
