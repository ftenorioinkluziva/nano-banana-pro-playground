"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Globe, Zap, Menu, X } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useCredits } from "@/hooks/use-credits"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NavigationBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { language, setLanguage, t } = useLanguage()
  const { credits, isLoading: isLoadingCredits } = useCredits()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { href: "/", label: t.home },
    { href: "/images", label: t.images },
    { href: "/videos", label: t.videos },
    { href: "/brands", label: t.brands },
    { href: "/products", label: t.products },
    { href: "/ugc/script", label: t.ugcScripts },
  ]

  // Add admin link if user calls "admin"
  if (session?.user?.role === "admin") {
    // links.push({ href: "/admin/usage-costs", label: "Admin" })
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">
                Creato
              </span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6">
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
                  suppressHydrationWarning
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white" suppressHydrationWarning>
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800 text-white">
                  {links.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "cursor-pointer focus:bg-zinc-800 focus:text-white",
                          pathname === link.href && "bg-zinc-800 text-white font-medium"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Credits Display */}
            {session && (
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-full px-3 py-1">
                <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-white">
                  {isLoadingCredits ? "..." : (credits ?? 0).toFixed(2)}
                </span>
              </div>
            )}

            <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
              <SelectTrigger className="w-[150px] h-9 bg-zinc-900/50 border-zinc-700 text-white text-xs" suppressHydrationWarning>
                <Globe className="size-3 mr-2" />
                <SelectValue placeholder={t.language || "Language"} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="pt" className="text-xs">Português</SelectItem>
                <SelectItem value="en" className="text-xs">English</SelectItem>
              </SelectContent>
            </Select>

            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" suppressHydrationWarning>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-white">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-zinc-400">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer" asChild>
                    <Link href="/settings/billing" className="flex justify-between items-center w-full">
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <div className="flex justify-between items-center w-full">
                      <span>Credits</span>
                      <span className="font-mono text-zinc-400">{(credits ?? 0).toFixed(2)}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onClick={handleSignOut} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                    {t.login}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="!bg-white !text-black hover:!bg-zinc-200">
                    {t.signup}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
