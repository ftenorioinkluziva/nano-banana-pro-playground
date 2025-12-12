"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { PromptEnhancementSuggestions } from "./prompt-enhancement-suggestions"
import { useEnhanceVideoPrompt } from "./hooks/use-enhance-video-prompt"

interface EnhancePromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: string
  mode?: string
  onApplyEnhanced: (enhancedPrompt: string) => void
}

export function EnhancePromptDialog({
  open,
  onOpenChange,
  prompt,
  mode,
  onApplyEnhanced,
}: EnhancePromptDialogProps) {
  const { enhancing, error, enhancedResult, enhancePrompt } = useEnhanceVideoPrompt()
  const [hasAttempted, setHasAttempted] = useState(false)

  const handleEnhance = async () => {
    setHasAttempted(true)
    const result = await enhancePrompt(prompt, mode)
    if (!result) {
      console.error("Failed to enhance prompt")
    }
  }

  const handleApply = (enhancedPrompt: string) => {
    onApplyEnhanced(enhancedPrompt)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setHasAttempted(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <DialogTitle>Enhance Your Video Prompt</DialogTitle>
          </div>
          <DialogDescription>
            Improve your prompt with AI-powered suggestions based on Google's video generation best practices.
            Your prompt will be enhanced with better structure, descriptive language, and technical elements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Prompt Display */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Current Prompt</p>
            <p className="text-white text-sm line-clamp-3">{prompt}</p>
            {prompt.length > 1500 && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠️ Your prompt is quite long ({prompt.length} chars). Consider keeping enhancements under 2000 chars.
              </p>
            )}
          </div>

          {/* Show enhancement or results */}
          {!hasAttempted && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">
                Get AI-powered suggestions to make your prompt more effective for video generation:
              </p>
              <ul className="text-sm text-zinc-400 space-y-2 ml-4">
                <li>✓ More descriptive and vivid language</li>
                <li>✓ Better structured with subject, action, style, camera</li>
                <li>✓ Enhanced cinematographic elements</li>
                <li>✓ Improved ambiance and lighting descriptions</li>
              </ul>
            </div>
          )}

          {enhancing && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-zinc-300">Enhancing your prompt with AI...</p>
              <p className="text-xs text-zinc-500">This may take a few seconds</p>
            </div>
          )}

          {error && !enhancing && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-300 text-sm font-medium">Failed to enhance prompt</p>
              <p className="text-red-400 text-xs mt-1">{error}</p>
            </div>
          )}

          {enhancedResult && (
            <PromptEnhancementSuggestions
              originalPrompt={enhancedResult.originalPrompt}
              enhancedPrompt={enhancedResult.enhancedPrompt}
              suggestions={enhancedResult.suggestions}
              onApply={handleApply}
              onClose={handleClose}
              isLoading={enhancing}
            />
          )}
        </div>

        {/* Action Buttons */}
        {!enhancedResult && !enhancing && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEnhance}
              disabled={enhancing || !prompt.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              <Sparkles size={18} className="mr-2" />
              Enhance Prompt
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-zinc-700 hover:bg-zinc-900"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
