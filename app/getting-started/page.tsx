"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Video, Image, Package, FileText, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

const FEATURES = [
  {
    icon: Image,
    titleKey: "gettingStartedFeatureImages" as const,
    descKey: "gettingStartedFeatureImagesDesc" as const,
    href: "/images",
  },
  {
    icon: Video,
    titleKey: "gettingStartedFeatureVideos" as const,
    descKey: "gettingStartedFeatureVideosDesc" as const,
    href: "/videos",
  },
  {
    icon: Package,
    titleKey: "gettingStartedFeatureProducts" as const,
    descKey: "gettingStartedFeatureProductsDesc" as const,
    href: "/products",
  },
  {
    icon: FileText,
    titleKey: "gettingStartedFeatureUGC" as const,
    descKey: "gettingStartedFeatureUGCDesc" as const,
    href: "/ugc",
  },
]

export default function GettingStartedPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/user/onboarding", { method: "POST" })
      router.push("/ugc")
    } catch {
      router.push("/ugc")
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {t.gettingStartedTitle || "Welcome to Creato!"}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {t.gettingStartedSubtitle || "Your AI-powered creative platform for generating stunning visuals and videos for your products."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.titleKey} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-white text-lg">
                      {t[feature.titleKey] || feature.titleKey}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-zinc-400 text-sm">
                    {t[feature.descKey] || feature.descKey}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {t.gettingStartedHowItWorks || "How it works"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                1
              </div>
              <div>
                <h4 className="text-white font-medium">
                  {t.gettingStartedStep1Title || "Register your products"}
                </h4>
                <p className="text-zinc-400 text-sm">
                  {t.gettingStartedStep1Desc || "Add your products with images and descriptions to generate personalized content."}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                2
              </div>
              <div>
                <h4 className="text-white font-medium">
                  {t.gettingStartedStep2Title || "Choose a capability"}
                </h4>
                <p className="text-zinc-400 text-sm">
                  {t.gettingStartedStep2Desc || "Select from pre-configured video styles or create custom prompts for your content."}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                3
              </div>
              <div>
                <h4 className="text-white font-medium">
                  {t.gettingStartedStep3Title || "Generate and download"}
                </h4>
                <p className="text-zinc-400 text-sm">
                  {t.gettingStartedStep3Desc || "Our AI will create high-quality content ready for your marketing campaigns."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            className="!bg-white !text-black hover:!bg-gray-200 px-8"
            onClick={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? t.loading : (t.gettingStartedCTA || "Start Creating")}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-zinc-500 text-sm mt-4">
            {t.gettingStartedCredits || "You have 10 free credits to get started!"}
          </p>
        </div>
      </div>
    </div>
  )
}
