/**
 * Enhanced Error Boundary Component
 * Provides better error handling with fallback UI and recovery options
 */

"use client"

import { Component, type ReactNode } from "react"
import { CenteredError } from "./error-state"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: any[] // If any of these change, reset the error boundary
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * Enhanced Error Boundary with better UX
 *
 * Usage:
 * ```tsx
 * <AppErrorBoundary>
 *   <YourComponent />
 * </AppErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <AppErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </AppErrorBoundary>
 * ```
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by AppErrorBoundary:", error, errorInfo)

    this.setState({ errorInfo })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // You can also send to error tracking service here
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || []
      const currentKeys = this.props.resetKeys || []

      if (prevKeys.length !== currentKeys.length ||
          prevKeys.some((key, index) => key !== currentKeys[index])) {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <CenteredError
            title="Something went wrong"
            message={
              this.state.error?.message ||
              "An unexpected error occurred. Please try again."
            }
            details={
              process.env.NODE_ENV === "development"
                ? this.state.errorInfo?.componentStack
                : undefined
            }
            onRetry={this.handleReset}
            onGoHome={() => window.location.href = "/"}
            retryLabel="Try Again"
          />
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary wrapper
 * For functional components that need error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <AppErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AppErrorBoundary>
    )
  }
}
