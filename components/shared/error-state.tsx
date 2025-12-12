/**
 * Unified Error States Component Library
 * Provides consistent error displays across the application
 */

import { AlertCircle, XCircle, AlertTriangle, RefreshCw, Home, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ============================================================================
// 1. INLINE ERROR (for form fields, small errors)
// ============================================================================

interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
      <AlertCircle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ============================================================================
// 2. ALERT ERROR (for banner-style errors)
// ============================================================================

interface AlertErrorProps {
  title?: string
  message: string
  variant?: "default" | "destructive"
  onDismiss?: () => void
  className?: string
}

export function AlertError({
  title = "Error",
  message,
  variant = "destructive",
  onDismiss,
  className,
}: AlertErrorProps) {
  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"
          aria-label="Dismiss"
        >
          <XCircle className="size-4" />
        </button>
      )}
    </Alert>
  )
}

// ============================================================================
// 3. CENTERED ERROR (for full sections/pages)
// ============================================================================

interface CenteredErrorProps {
  title?: string
  message: string
  details?: string
  onRetry?: () => void
  onGoBack?: () => void
  onGoHome?: () => void
  retryLabel?: string
  className?: string
}

export function CenteredError({
  title = "Something went wrong",
  message,
  details,
  onRetry,
  onGoBack,
  onGoHome,
  retryLabel = "Try Again",
  className,
}: CenteredErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 py-12 px-4", className)}>
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-destructive/10 p-4">
          <XCircle className="size-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
          {details && (
            <details className="text-xs text-muted-foreground/70 mt-2">
              <summary className="cursor-pointer hover:text-muted-foreground">
                Show details
              </summary>
              <pre className="mt-2 p-2 rounded bg-muted/50 text-left overflow-x-auto">
                {details}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="size-4 mr-2" />
              {retryLabel}
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              <ChevronLeft className="size-4 mr-2" />
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="ghost">
              <Home className="size-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 4. CARD ERROR (for errors within cards)
// ============================================================================

interface CardErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function CardError({ message, onRetry, className }: CardErrorProps) {
  return (
    <div className={cn("rounded-lg border border-destructive/50 bg-destructive/5 p-6", className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-2">
          <p className="text-sm font-medium">Failed to load content</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="size-3 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 5. VALIDATION ERROR (for form validation)
// ============================================================================

interface ValidationErrorProps {
  errors: string[]
  className?: string
}

export function ValidationError({ errors, className }: ValidationErrorProps) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

// ============================================================================
// 6. API ERROR (for API-specific errors with status codes)
// ============================================================================

interface ApiErrorProps {
  status?: number
  message: string
  endpoint?: string
  onRetry?: () => void
  className?: string
}

export function ApiError({
  status,
  message,
  endpoint,
  onRetry,
  className,
}: ApiErrorProps) {
  const getErrorTitle = (status?: number) => {
    if (!status) return "Request Failed"
    if (status === 400) return "Bad Request"
    if (status === 401) return "Unauthorized"
    if (status === 403) return "Forbidden"
    if (status === 404) return "Not Found"
    if (status === 429) return "Too Many Requests"
    if (status >= 500) return "Server Error"
    return "Request Failed"
  }

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertTriangle className="size-4" />
      <AlertTitle>
        {getErrorTitle(status)}
        {status && <span className="ml-2 text-xs font-mono">({status})</span>}
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        {endpoint && (
          <p className="text-xs font-mono text-muted-foreground/70">
            Endpoint: {endpoint}
          </p>
        )}
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="mt-3"
          >
            <RefreshCw className="size-3 mr-2" />
            Retry Request
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// ============================================================================
// 7. QUOTA ERROR (specific for API quota limits)
// ============================================================================

interface QuotaErrorProps {
  provider: string
  message: string
  fallbackMessage?: string
  onRetry?: () => void
  onUseFallback?: () => void
  className?: string
}

export function QuotaError({
  provider,
  message,
  fallbackMessage,
  onRetry,
  onUseFallback,
  className,
}: QuotaErrorProps) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertTriangle className="size-4" />
      <AlertTitle>Quota Exceeded - {provider}</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        {fallbackMessage && (
          <p className="text-sm text-muted-foreground mb-3">{fallbackMessage}</p>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Try Again
            </Button>
          )}
          {onUseFallback && (
            <Button onClick={onUseFallback} size="sm">
              Use Fallback
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// ============================================================================
// 8. NETWORK ERROR (for connectivity issues)
// ============================================================================

interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <CenteredError
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Retry Connection"
      className={className}
    />
  )
}

// ============================================================================
// 9. 404 ERROR (for not found pages)
// ============================================================================

interface NotFoundErrorProps {
  title?: string
  message?: string
  onGoHome?: () => void
  onGoBack?: () => void
  className?: string
}

export function NotFoundError({
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  onGoHome,
  onGoBack,
  className,
}: NotFoundErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 py-12 px-4 min-h-[400px]", className)}>
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="text-6xl font-bold text-muted-foreground/20">404</div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex gap-2">
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              <ChevronLeft className="size-4 mr-2" />
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome}>
              <Home className="size-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
