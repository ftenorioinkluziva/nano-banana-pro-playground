"use client"

import Link from "next/link"
import { ArrowRight, Image, Video, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const features = [
    {
      icon: Image,
      title: "Image Generation",
      description: "Create stunning images from text or edit existing images with AI",
      href: "/images",
      label: "Generate Images",
    },
    {
      icon: Video,
      title: "Video Generation",
      description: "Generate professional videos from prompts using Google Veo AI",
      href: "/videos",
      label: "Create Videos",
    },
    {
      icon: Sparkles,
      title: "Products",
      description: "Manage and generate product creatives for your catalog",
      href: "/products",
      label: "Product Tools",
    },
    {
      icon: Zap,
      title: "Script UGC Videos",
      description: "Create User-Generated Content videos in seconds",
      href: "/ugc/script",
      label: "UGC Studio",
    },
  ]

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-black to-zinc-900 px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI-Powered Creative Generation
          </h1>
          <p className="mt-6 text-xl text-zinc-400">
            Create stunning images, videos, and marketing materials with the power of Google's latest AI models
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/images">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/videos">
              <Button size="lg" variant="outline">
                Try Video Generation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-zinc-400">
              Complete suite of AI tools for content creators
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link key={feature.href} href={feature.href}>
                  <div className="group relative h-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur transition-all hover:border-zinc-700 hover:bg-zinc-800/50">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="relative">
                      <Icon className="h-8 w-8 text-blue-400 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-6">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
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
              <p className="mt-2 text-zinc-400">Creations Generated</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">10K+</div>
              <p className="mt-2 text-zinc-400">Active Creators</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">24/7</div>
              <p className="mt-2 text-zinc-400">API Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-800 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to create?
          </h2>
          <p className="mt-4 text-zinc-400">
            Start generating amazing content in seconds
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Link href="/images">
              <Button className="gap-2">
                <Image className="h-4 w-4" />
                Generate Images
              </Button>
            </Link>
            <Link href="/videos">
              <Button variant="outline" className="gap-2">
                <Video className="h-4 w-4" />
                Generate Videos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
