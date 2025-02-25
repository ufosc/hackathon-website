"use client"

import { ArrowUpRight, MenuIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navLinks = [
    { href: "https://ufosc.org", label: "UFOSC.ORG" },
    { href: "https://ufosc.org/#get-in-touch", label: "CONTACT" },
    { href: "https://www.instagram.com/uf_osc", label: "INSTAGRAM" },
    { href: "https://discord.com/invite/Gsxej6u", label: "DISCORD" },
    // TODO: ADD SPONSOR PACKET ONCE IT'S READY.
    // { href: "https://ufosc.org", label: "SPONSOR PACKET" },
  ]

  return (
    <header className="flex items-center justify-end w-full mb-2 px-4 py-2 sticky top-0 z-10">
      <nav className="hidden md:flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            className="flex flex-row items-center font-[Times]"
            href={link.href}
          >
            {link.label}
            <ArrowUpRight className="ml-1" />
          </Link>
        ))}
      </nav>
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle Menu"
          className="text-2xl focus:outline-none"
        >
          <MenuIcon />
        </button>
      </div>
      {menuOpen && (
        <nav className="absolute top-full left-0 w-full bg-[#F9FAFE] shadow-md py-4 md:hidden">
          <ul className="flex flex-col items-center gap-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-row items-center font-[Times] text-lg"
                  href={link.href}
                >
                  {link.label}
                  <ArrowUpRight className="ml-1" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
