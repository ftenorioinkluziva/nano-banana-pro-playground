import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Image Generation - Creato",
  description: "Generate and edit images with AI-powered tools. Create stunning visuals from text or edit existing images.",
}

export default function ImagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
