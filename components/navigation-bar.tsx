"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavigationBar() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Home" },
    { href: "/images", label: "Images" },
    { href: "/videos", label: "Videos" },
    { href: "/products", label: "Products" },
    { href: "/ugc/script", label: "Script UGC Videos" },
  ]

  return (
    <nav className="border-b border-zinc-800 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <Image
                src="/creato-logo.png"
                alt="Creato Logo"
                width={40}
                height={40}
                priority
              />
            </Link>
            <div className="flex gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors hover:text-white",
                    pathname === link.href
                      ? "text-white font-medium"
                      : "text-zinc-400"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
