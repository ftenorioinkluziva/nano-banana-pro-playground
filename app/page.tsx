"use client"

import Link from "next/link"
import { ArrowRight, Image as ImageIcon, Video, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export default function Home() {
  const { t } = useLanguage()

  const features = [
    {
      icon: ImageIcon,
      title: t.featureImageTitle,
      description: t.featureImageDesc,
      href: "/images",
      label: t.featureImageLabel,
    },
    {
      icon: Video,
      title: t.featureVideoTitle,
      description: t.featureVideoDesc,
      href: "/videos",
      label: t.featureVideoLabel,
    },
    {
      icon: Sparkles,
      title: t.featureProductsTitle,
      description: t.featureProductsDesc,
      href: "/products",
      label: t.featureProductsLabel,
    },
    {
      icon: Zap,
      title: t.featureUgcTitle,
      description: t.featureUgcDesc,
      href: "/ugc/script",
      label: t.featureUgcLabel,
    },
  ]

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Decorative Background Elements */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[120px]" />

        <div className="mx-auto max-w-4xl text-center relative">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl" suppressHydrationWarning>
            {t.heroTitle}
          </h1>
          <p className="mt-6 text-xl text-zinc-400" suppressHydrationWarning>
            {t.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/images">
              <Button size="lg" className="gap-2" suppressHydrationWarning>
                {t.getStarted}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/videos">
              <Button size="lg" variant="outline" suppressHydrationWarning>
                {t.tryVideo}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl" suppressHydrationWarning>
              {t.featuresTitle}
            </h2>
            <p className="mt-4 text-zinc-400" suppressHydrationWarning>
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link key={feature.href} href={feature.href}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-8 backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:bg-zinc-800/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">
                      <Icon className="h-8 w-8 text-blue-400 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2" suppressHydrationWarning>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-6" suppressHydrationWarning>
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-medium" suppressHydrationWarning>
                        {feature.label}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-zinc-800 px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">100K+</div>
              <p className="mt-2 text-zinc-400" suppressHydrationWarning>{t.statsCreations}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">10K+</div>
              <p className="mt-2 text-zinc-400" suppressHydrationWarning>{t.statsUsers}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">24/7</div>
              <p className="mt-2 text-zinc-400" suppressHydrationWarning>{t.statsApi}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-800 px-4 py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_70%)]" />
        <div className="mx-auto max-w-2xl text-center relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl" suppressHydrationWarning>
            {t.readyToCreate}
          </h2>
          <p className="mt-4 text-zinc-400 text-lg" suppressHydrationWarning>
            {t.startGenerating}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/images">
              <Button className="gap-2" suppressHydrationWarning>
                <ImageIcon className="h-4 w-4" />
                {t.featureImageLabel}
              </Button>
            </Link>
            <Link href="/videos">
              <Button variant="outline" className="gap-2" suppressHydrationWarning>
                <Video className="h-4 w-4" />
                {t.generateVideos}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
