import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#003B73] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">UV</span>
        </div>
        <h1 className="text-7xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบหน้าที่ต้องการ</h2>
        <p className="text-gray-500 mb-6">ขออภัย ไม่พบเพจที่คุณกำลังมองหา</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-[#003B73] text-white rounded-lg text-sm font-medium hover:bg-[#002d5a]"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
