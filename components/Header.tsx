"use client"

import { ArrowUpRight, MenuIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  const navLinks = [
    { href: "https://ufosc.org", label: "UFOSC.ORG", external: true },
    { href: "https://ufosc.org/#get-in-touch", label: "CONTACT", external: true },
    { href: "https://www.instagram.com/uf_osc", label: "INSTAGRAM", external: true },
    { href: "https://discord.com/invite/Gsxej6u", label: "DISCORD", external: true },
    // TODO: ADD SPONSOR PACKET ONCE IT'S READY.
    // { href: "https://ufosc.org", label: "SPONSOR PACKET" },
  ]

  const sectionLinks = [
    { id: "about", label: "ABOUT" },
    { id: "faq", label: "FAQ" },
    { id: "sponsors", label: "SPONSORS" },
    { id: "registration", label: "REGISTER" },
  ]

  return (
    <header className="flex items-center justify-between w-full mb-2 px-4 py-2 sticky top-0 z-10 bg-[#F9FAFE] bg-opacity-95 backdrop-blur-sm">
      {/* Section Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        {sectionLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollToSection(link.id)}
            className="font-[Times] hover:text-[#1C2646] transition-colors"
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* External Links */}
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

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle Menu"
          className="text-2xl focus:outline-none"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="absolute top-full left-0 w-full bg-[#F9FAFE] shadow-md py-4 md:hidden">
          <ul className="flex flex-col items-center gap-4">
            {/* Section Links */}
            {sectionLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className="font-[Times] text-lg hover:text-[#1C2646] transition-colors"
                >
                  {link.label}
                </button>
              </li>
            ))}
            {/* Divider */}
            <li className="w-full h-px bg-gray-300 my-2"></li>
            {/* External Links */}
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
