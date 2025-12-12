"use client"

import React from "react"
import { Copy, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EnhancementSuggestions {
  subject?: string
  action?: string
  style?: string
  camera?: string
  composition?: string
  ambiance?: string
}

interface PromptEnhancementSuggestionsProps {
  originalPrompt: string
  enhancedPrompt: string
  suggestions: EnhancementSuggestions
  onApply: (enhancedPrompt: string) => void
  onClose: () => void
  isLoading?: boolean
}

const SUGGESTION_LABELS = {
  subject: "Subject",
  action: "Action",
  style: "Style",
  camera: "Camera",
  composition: "Composition",
  ambiance: "Ambiance",
}

const SUGGESTION_DESCRIPTIONS = {
  subject: "The main focus of your video (object, person, animal, scenery)",
  action: "What the subject is doing",
  style: "Creative direction and artistic style",
  camera: "Camera positioning and movement",
  composition: "How the shot is framed",
  ambiance: "Lighting, colors, and atmosphere",
}

export function PromptEnhancementSuggestions({
  originalPrompt,
  enhancedPrompt,
  suggestions,
  onApply,
  onClose,
  isLoading = false,
}: PromptEnhancementSuggestionsProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyEnhanced = () => {
    navigator.clipboard.writeText(enhancedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const availableSuggestions = Object.entries(suggestions).filter(
    ([_, value]) => value && value.length > 0
  )

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Enhanced Prompt</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
          disabled={isLoading}
        >
          <X size={20} className="text-zinc-400" />
        </button>
      </div>

      {/* Original Prompt */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Original Prompt</p>
        <p className="text-zinc-300 text-sm">{originalPrompt}</p>
      </div>

      {/* Enhanced Prompt */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-blue-500 uppercase tracking-wide mb-2">Enhanced Prompt</p>
            <p className="text-white text-sm leading-relaxed">{enhancedPrompt}</p>
          </div>
          <button
            onClick={handleCopyEnhanced}
            className="ml-2 p-2 hover:bg-blue-800/30 rounded transition-colors flex-shrink-0"
            title="Copy enhanced prompt"
          >
            {copied ? (
              <Check size={18} className="text-green-400" />
            ) : (
              <Copy size={18} className="text-blue-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-blue-400">
          ✨ Enhanced with better descriptive language and structure
        </p>
      </div>

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Improvement Suggestions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableSuggestions.map(([key, value]) => (
              <div
                key={key}
                className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 space-y-1 hover:border-zinc-600 transition-colors"
              >
                <p className="text-xs text-zinc-400 uppercase tracking-wide">
                  {SUGGESTION_LABELS[key as keyof EnhancementSuggestions]}
                </p>
                <p className="text-xs text-zinc-500">
                  {SUGGESTION_DESCRIPTIONS[key as keyof EnhancementSuggestions]}
                </p>
                <p className="text-sm text-zinc-200 mt-2">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character Count */}
      <div className="flex justify-between items-center text-xs text-zinc-500 px-1">
        <span>Original: {originalPrompt.length} characters</span>
        <span>Enhanced: {enhancedPrompt.length} characters</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onApply(enhancedPrompt)}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Apply Enhanced Prompt"}
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
          className="flex-1 border-zinc-700 hover:bg-zinc-900"
        >
          Keep Original
        </Button>
      </div>
    </div>
  )
}
