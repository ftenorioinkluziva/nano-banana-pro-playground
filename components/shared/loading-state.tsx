/**
 * Unified Loading States Component Library
 * Provides consistent loading indicators across the application
 */

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

// ============================================================================
// 1. INLINE SPINNER (for buttons, small spaces)
// ============================================================================

interface InlineSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function InlineSpinner({ size = "md", className }: InlineSpinnerProps) {
  const sizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-6",
  }

  return <Spinner className={cn(sizes[size], className)} />
}

// ============================================================================
// 2. CENTERED SPINNER (for full sections/pages)
// ============================================================================

interface CenteredSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  message?: string
  className?: string
}

export function CenteredSpinner({
  size = "lg",
  message,
  className,
}: CenteredSpinnerProps) {
  const sizes = {
    sm: "size-6",
    md: "size-8",
    lg: "size-12",
    xl: "size-16",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>
      <Spinner className={sizes[size]} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}

// ============================================================================
// 3. PROGRESS SPINNER (with percentage)
// ============================================================================

interface ProgressSpinnerProps {
  progress: number // 0-100
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProgressSpinner({
  progress,
  message,
  size = "md",
  className,
}: ProgressSpinnerProps) {
  const sizes = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <Spinner className={sizes[size]} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
      )}
    </div>
  )
}

// ============================================================================
// 4. CARD SKELETON (for loading cards/content)
// ============================================================================

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border border-border bg-card p-4 space-y-3",
            className
          )}
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </>
  )
}

// ============================================================================
// 5. IMAGE SKELETON (for loading images)
// ============================================================================

interface ImageSkeletonProps {
  aspectRatio?: "square" | "video" | "portrait"
  className?: string
}

export function ImageSkeleton({
  aspectRatio = "square",
  className,
}: ImageSkeletonProps) {
  const ratios = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[9/16]",
  }

  return (
    <Skeleton className={cn("w-full", ratios[aspectRatio], className)} />
  )
}

// ============================================================================
// 6. LIST SKELETON (for loading lists)
// ============================================================================

interface ListSkeletonProps {
  rows?: number
  showAvatar?: boolean
  className?: string
}

export function ListSkeleton({
  rows = 3,
  showAvatar = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton className="size-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// 7. TABLE SKELETON (for loading tables)
// ============================================================================

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// 8. FULL PAGE LOADER (for page-level loading)
// ============================================================================

interface FullPageLoaderProps {
  message?: string
  showLogo?: boolean
}

export function FullPageLoader({ message, showLogo }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {showLogo && (
          <div className="text-2xl font-bold">Creato</div>
        )}
        <Spinner className="size-12" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 9. OVERLAY LOADER (for modal/dialog loading)
// ============================================================================

interface OverlayLoaderProps {
  message?: string
  progress?: number
}

export function OverlayLoader({ message, progress }: OverlayLoaderProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {progress !== undefined ? (
          <ProgressSpinner progress={progress} message={message} />
        ) : (
          <>
            <Spinner className="size-12" />
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
