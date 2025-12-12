import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Video Generation - Creato",
  description: "Generate stunning videos with AI-powered video generation. Create professional videos from text, images, or extend existing videos.",
}

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
