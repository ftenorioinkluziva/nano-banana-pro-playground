import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { Analytics } from "@vercel/analytics/react"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavigationBar } from "@/components/navigation-bar"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Creato - AI Creative Generation for Content Creators",
  description:
    "Creato helps content creators generate high-quality creatives, social media posts, and marketing materials using AI. Powered by Google Gemini 2.0 Flash.",
  keywords: [
    "creato",
    "AI creative generation",
    "content creator tools",
    "AI image generation",
    "social media creatives",
    "marketing materials AI",
    "AI ad creator",
    "content creation tools",
    "AI for creators",
    "Google Gemini",
    "Gemini 2.5 Flash",
  ],
  authors: [{ name: "v0" }],
  creator: "v0",
  publisher: "v0",
  generator: "v0.app",
  metadataBase: new URL("https://v0nanobananapro.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://v0nanobananapro.vercel.app",
    title: "Creato - AI Creative Generation for Content Creators",
    description:
      "Creato helps content creators generate high-quality creatives, social media posts, and marketing materials using AI.",
    siteName: "Creato",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Creato - AI Creative Generation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creato - AI Creative Generation for Content Creators",
    description:
      "Creato helps content creators generate high-quality creatives, social media posts, and marketing materials using AI.",
    creator: "@vercel",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
      style={{ backgroundColor: "#000000" }}
    >
      <head>
        <link rel="icon" href="/creato-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-mono antialiased" style={{ backgroundColor: "#000000" }}>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationBar />
            <Suspense fallback={null}>{children}</Suspense>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
