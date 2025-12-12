/**
 * Unified Empty States Component Library
 * Provides consistent empty state displays across the application
 */

import {
  FileQuestion,
  Image,
  Video,
  Package,
  Search,
  Inbox,
  Plus,
  Upload,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"

// ============================================================================
// 1. GENERIC EMPTY STATE (customizable)
// ============================================================================

interface GenericEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function GenericEmptyState({
  icon = <Inbox className="size-12" />,
  title,
  description,
  action,
  secondaryAction,
  className,
}: GenericEmptyStateProps) {
  return (
    <Empty className={cn(className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>

      {(action || secondaryAction) && (
        <EmptyContent>
          <div className="flex flex-wrap gap-2 justify-center">
            {action && (
              <Button onClick={action.onClick}>
                {action.icon}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </EmptyContent>
      )}
    </Empty>
  )
}

// ============================================================================
// 2. NO IMAGES EMPTY STATE
// ============================================================================

interface NoImagesEmptyStateProps {
  onGenerate?: () => void
  onUpload?: () => void
  className?: string
}

export function NoImagesEmptyState({
  onGenerate,
  onUpload,
  className,
}: NoImagesEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={<Image className="size-12" />}
      title="No images yet"
      description="Generate your first image with AI or upload existing images to get started."
      action={
        onGenerate
          ? {
              label: "Generate Image",
              onClick: onGenerate,
              icon: <Sparkles className="size-4 mr-2" />,
            }
          : undefined
      }
      secondaryAction={
        onUpload
          ? {
              label: "Upload Image",
              onClick: onUpload,
            }
          : undefined
      }
      className={className}
    />
  )
}

// ============================================================================
// 3. NO VIDEOS EMPTY STATE
// ============================================================================

interface NoVideosEmptyStateProps {
  onGenerate?: () => void
  className?: string
}

export function NoVideosEmptyState({
  onGenerate,
  className,
}: NoVideosEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={<Video className="size-12" />}
      title="No videos yet"
      description="Create your first AI-generated video using Google Veo. Choose from text-to-video, frames-to-video, or reference-based generation."
      action={
        onGenerate
          ? {
              label: "Generate Video",
              onClick: onGenerate,
              icon: <Plus className="size-4 mr-2" />,
            }
          : undefined
      }
      className={className}
    />
  )
}

// ============================================================================
// 4. NO PRODUCTS EMPTY STATE
// ============================================================================

interface NoProductsEmptyStateProps {
  onAddProduct?: () => void
  className?: string
}

export function NoProductsEmptyState({
  onAddProduct,
  className,
}: NoProductsEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={<Package className="size-12" />}
      title="No products yet"
      description="Add your first product to start generating creatives and marketing materials."
      action={
        onAddProduct
          ? {
              label: "Add Product",
              onClick: onAddProduct,
              icon: <Plus className="size-4 mr-2" />,
            }
          : undefined
      }
      className={className}
    />
  )
}

// ============================================================================
// 5. NO SEARCH RESULTS EMPTY STATE
// ============================================================================

interface NoSearchResultsEmptyStateProps {
  query: string
  onClearSearch?: () => void
  className?: string
}

export function NoSearchResultsEmptyState({
  query,
  onClearSearch,
  className,
}: NoSearchResultsEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={<Search className="size-12" />}
      title="No results found"
      description={`No results found for "${query}". Try adjusting your search terms or filters.`}
      action={
        onClearSearch
          ? {
              label: "Clear Search",
              onClick: onClearSearch,
            }
          : undefined
      }
      className={className}
    />
  )
}

// ============================================================================
// 6. NO HISTORY EMPTY STATE
// ============================================================================

interface NoHistoryEmptyStateProps {
  type?: "images" | "videos" | "generations"
  onGenerate?: () => void
  className?: string
}

export function NoHistoryEmptyState({
  type = "generations",
  onGenerate,
  className,
}: NoHistoryEmptyStateProps) {
  const config = {
    images: {
      icon: <Image className="size-12" />,
      title: "No image history",
      description: "Your generated images will appear here. Start creating!",
    },
    videos: {
      icon: <Video className="size-12" />,
      title: "No video history",
      description: "Your generated videos will appear here. Start creating!",
    },
    generations: {
      icon: <Sparkles className="size-12" />,
      title: "No generation history",
      description: "Your AI generations will be saved here automatically.",
    },
  }

  const { icon, title, description } = config[type]

  return (
    <GenericEmptyState
      icon={icon}
      title={title}
      description={description}
      action={
        onGenerate
          ? {
              label: "Start Generating",
              onClick: onGenerate,
              icon: <Plus className="size-4 mr-2" />,
            }
          : undefined
      }
      className={className}
    />
  )
}

// ============================================================================
// 7. UPLOAD EMPTY STATE
// ============================================================================

interface UploadEmptyStateProps {
  accept?: string
  onUpload?: () => void
  className?: string
}

export function UploadEmptyState({
  accept = "images",
  onUpload,
  className,
}: UploadEmptyStateProps) {
  return (
    <Empty className={cn("border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Upload className="size-12" />
        </EmptyMedia>
        <EmptyTitle>Upload {accept}</EmptyTitle>
        <EmptyDescription>
          Drag and drop {accept} here, or click to select files
        </EmptyDescription>
      </EmptyHeader>

      {onUpload && (
        <EmptyContent>
          <Button onClick={onUpload} variant="outline">
            <Upload className="size-4 mr-2" />
            Browse Files
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

// ============================================================================
// 8. NO DATA EMPTY STATE (for tables/lists)
// ============================================================================

interface NoDataEmptyStateProps {
  title?: string
  description?: string
  onRefresh?: () => void
  className?: string
}

export function NoDataEmptyState({
  title = "No data available",
  description = "There's no data to display at the moment.",
  onRefresh,
  className,
}: NoDataEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={<FileQuestion className="size-12" />}
      title={title}
      description={description}
      action={
        onRefresh
          ? {
              label: "Refresh",
              onClick: onRefresh,
            }
          : undefined
      }
      className={className}
    />
  )
}
