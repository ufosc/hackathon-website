import type { Metadata } from "next"
import Header from "@/components/Header"
import "./globals.css"

export const metadata: Metadata = {
  title: "OSC Mini-Hackathon",
  description: "UF Open Source Club Hackathon 2025",
}

export default function RootLayout({children}:
Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body className="md:w-screen md:h-screen md:p-[4rem] md:pt-[2rem] pt-2">
        <Header />
        {children}
      </body>
    </html>
  )
}
