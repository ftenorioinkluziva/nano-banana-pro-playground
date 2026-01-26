"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScriptViewer } from "@/components/ugc/script-viewer"
import { toast } from "sonner"
import type { ScriptOutput } from "@/lib/agents/script-generator"
import { useLanguage } from "@/components/language-provider"

interface Script {
  id: string
  product_id: number
  product_name: string
  product_image_url: string | null
  pain_point: string
  context: string | null
  tone: string
  project_summary: string
  script_json: ScriptOutput
  status: string
  created_at: string
  updated_at: string
}

export function ScriptHistory() {
  const { t, language } = useLanguage()
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/scripts")
      if (!response.ok) throw new Error("Failed to fetch scripts")

      const data = await response.json()
      setScripts(data.scripts || [])
    } catch (error) {
      console.error("Error fetching scripts:", error)
      toast.error(t.errorLoadingHistory)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (scriptId: string) => {
    if (!confirm(t.confirmDeleteScript)) return

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete script")

      toast.success(t.scriptDeletedSuccessfully)

      // If the deleted script was selected, clear selection
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null)
      }

      fetchScripts()
    } catch (error) {
      console.error("Error deleting script:", error)
      toast.error(t.errorDeleting)
    }
  }

  const handleScriptChange = async (updatedScript: ScriptOutput) => {
    if (!selectedScript) return

    try {
      const response = await fetch(`/api/scripts/${selectedScript.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script_json: updatedScript,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update script")
      }

      // Update the selected script with new data
      setSelectedScript({
        ...selectedScript,
        script_json: updatedScript,
        project_summary: updatedScript.project_summary,
      })

      // Update in the list
      setScripts(scripts.map(s =>
        s.id === selectedScript.id
          ? { ...s, script_json: updatedScript, project_summary: updatedScript.project_summary }
          : s
      ))

      toast.success(t.scriptUpdatedSuccessfully)
    } catch (error) {
      console.error("Error updating script:", error)
      toast.error(error instanceof Error ? error.message : t.errorUpdatingScript)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">{t.loadingHistory}...</p>
        </div>
      </div>
    )
  }

  if (scripts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-700 rounded-lg">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">{t.noHistoryFound}</p>
          <p className="text-sm mt-1">{t.fillFormToGenerate}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Scripts List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.scriptHistory}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {scripts.length} {t.scriptsSaved}
            </p>
          </div>
          <Button
            onClick={fetchScripts}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-white/10"
          >
            🔄
          </Button>
        </div>

        {/* Scripts List */}
        <div className="space-y-3">
          {scripts.map((script) => (
            <Card
              key={script.id}
              className={`bg-white/5 border-gray-700 p-4 hover:bg-white/10 transition-colors cursor-pointer ${selectedScript?.id === script.id ? "ring-2 ring-white" : ""
                }`}
              onClick={() => setSelectedScript(script)}
            >
              <div className="flex items-start gap-3">
                {/* Product Image */}
                {script.product_image_url && (
                  <img
                    src={script.product_image_url}
                    alt={script.product_name}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white mb-1 truncate">{script.product_name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">{script.project_summary}</p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="secondary" className="bg-white/10 text-xs">
                      {script.script_json.scenes.length} {t.scenesCount}
                    </Badge>
                    <span>•</span>
                    <span>{formatDate(script.created_at)}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        const jsonString = JSON.stringify(script.script_json, null, 2)
                        navigator.clipboard.writeText(jsonString)
                        toast.success(t.jsonCopied)
                      }}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-white/10 text-xs h-7"
                    >
                      📋 {t.copy}
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(script.id)
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-500 hover:bg-red-500/10 text-xs h-7"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column: Script Viewer */}
      <div>
        {!selectedScript ? (
          <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-700 rounded-lg">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <p className="text-lg font-medium">{t.selectScript}</p>
              <p className="text-sm mt-1">{t.clickToViewDetails}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{t.scriptDetails}</h3>
              <Button
                onClick={() => setSelectedScript(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                ✕ {t.closeDetails}
              </Button>
            </div>

            {/* Script Viewer */}
            <ScriptViewer
              script={selectedScript.script_json}
              scriptId={selectedScript.id}
              onScriptChange={handleScriptChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
