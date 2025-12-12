"use client"

import { ImageCombiner } from "@/components/image-combiner"
import type { Metadata } from "next"

// Note: Metadata cannot be used in 'use client' files
// See: app/images/layout.tsx for metadata setup

export default function ImagesPage() {
  return (
    <main className="bg-background">
      <ImageCombiner />
    </main>
  )
}
