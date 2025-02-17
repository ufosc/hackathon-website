import type { Metadata } from "next"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "OSC Mini-Hackathon",
  description: "UF Open Source Club Hackathon 2025",
}

export default function RootLayout({children}:
Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>
        <header className="flex sticky w-full content-center items-center gap-4 justify-end mb-5">
          <Link className="flex flex-row items-center font-[Times]"
            href="https://ufosc.org">
            UFOSC.ORG
            <ArrowUpRight/>
          </Link>
          <Link className="flex flex-row items-center font-[Times]"
            href="https://ufosc.org/#get-in-touch">
            CONTACT
            <ArrowUpRight/>
          </Link>
          <Link className="flex flex-row items-center font-[Times]"
            href="https://www.instagram.com/uf_osc">
            INSTAGRAM
            <ArrowUpRight/>
          </Link>
          <Link className="flex flex-row items-center font-[Times]"
            href="https://discord.com/invite/Gsxej6u">
            DISCORD
            <ArrowUpRight/>
          </Link>
          <Link className="flex flex-row items-center font-[Times]"
            href="https://ufosc.org">
            SPONSOR PACKET
            <ArrowUpRight/>
          </Link>
        </header>
        {children}
      </body>
    </html>
  )
}
