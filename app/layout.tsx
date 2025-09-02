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
      <head>
        {/* DotGothic16 font preload */}
        <link rel="preload" href="/DotGothic16-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#2a140c] text-[#f9fafe] font-sans min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  )
}
