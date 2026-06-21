import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "LIMS | U&V Holding",
  description: "Laboratory Information Management System",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full bg-[#f8fafc]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
