"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { ScriptOutput, ScriptScene } from "@/lib/agents/script-generator"

interface SceneVideo {
  id: string
  video_url: string | null
  video_base64: string | null
  status: "generating" | "complete" | "error"
  error_message?: string
  task_id?: string
  created_at: string
  completed_at?: string
}

interface ScriptViewerProps {
  script: ScriptOutput
  scriptId: string | null
  onScriptChange: (updatedScript: ScriptOutput) => void
}

const SCENE_TYPE_LABELS = {
  hook: { label: "Hook", color: "bg-purple-500" },
  solution: { label: "Solução", color: "bg-blue-500" },
  benefit: { label: "Benefício", color: "bg-green-500" },
  cta: { label: "CTA", color: "bg-orange-500" },
}

export function ScriptViewer({ script, scriptId, onScriptChange }: ScriptViewerProps) {
  const [editedScript, setEditedScript] = useState<ScriptOutput>(script)
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [sceneVideos, setSceneVideos] = useState<Map<number, SceneVideo>>(new Map())
  const [generatingScenes, setGeneratingScenes] = useState<Set<number>>(new Set())

  // Fetch existing videos for this script
  useEffect(() => {
    if (!scriptId) return

    async function fetchSceneVideos() {
      try {
        const response = await fetch(`/api/scripts/${scriptId}/videos`)
        const data = await response.json()

        if (data.success) {
          const videosMap = new Map<number, SceneVideo>()
          data.videos.forEach((video: any) => {
            videosMap.set(video.scene_id, video)
          })
          setSceneVideos(videosMap)
        }
      } catch (error) {
        console.error("Error fetching scene videos:", error)
      }
    }

    fetchSceneVideos()
  }, [scriptId])

  const toggleScene = (sceneId: number) => {
    const newExpanded = new Set(expandedScenes)
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId)
    } else {
      newExpanded.add(sceneId)
    }
    setExpandedScenes(newExpanded)
  }

  const handleSceneChange = (sceneIndex: number, field: keyof ScriptScene, value: string | number) => {
    const newScenes = [...editedScript.scenes]
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], [field]: value }
    setEditedScript({ ...editedScript, scenes: newScenes })
    setHasChanges(true)
  }

  const handleSave = () => {
    onScriptChange(editedScript)
    setHasChanges(false)
  }

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(editedScript, null, 2)
    navigator.clipboard.writeText(jsonString)
    toast.success("JSON copiado para a área de transferência!")
  }

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(editedScript, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `roteiro-ugc-${scriptId || Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("JSON baixado com sucesso!")
  }

  const handleGenerateVideo = async (sceneId: number) => {
    if (!scriptId) {
      toast.error("Script ID não encontrado")
      return
    }

    // Mark scene as generating
    setGeneratingScenes(prev => new Set(prev).add(sceneId))

    try {
      const response = await fetch(
        `/api/scripts/${scriptId}/scenes/${sceneId}/generate-video`,
        { method: "POST" }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate video")
      }

      const data = await response.json()

      // Update scene videos map
      setSceneVideos(prev => {
        const newMap = new Map(prev)
        newMap.set(sceneId, data.sceneVideo)
        return newMap
      })

      toast.success(`Vídeo da Cena ${sceneId} gerado com sucesso!`)
    } catch (error) {
      console.error(`Error generating video for scene ${sceneId}:`, error)
      toast.error(error instanceof Error ? error.message : "Erro ao gerar vídeo")
    } finally {
      setGeneratingScenes(prev => {
        const newSet = new Set(prev)
        newSet.delete(sceneId)
        return newSet
      })
    }
  }

  const handleDownloadVideo = (sceneId: number, sceneVideo: SceneVideo) => {
    const videoSource = sceneVideo.video_base64 || sceneVideo.video_url
    if (!videoSource) {
      toast.error("Vídeo não disponível para download")
      return
    }

    const a = document.createElement("a")
    a.href = videoSource
    a.download = `cena-${sceneId}-${scriptId}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("Download iniciado!")
  }

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card className="bg-white/5 border-gray-700 p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📝</div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Resumo do Projeto</h3>
            <p className="text-lg text-white">{editedScript.project_summary}</p>
          </div>
        </div>
      </Card>

      {/* Scenes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span>Cenas</span>
          <Badge variant="secondary" className="bg-white/10">
            {editedScript.scenes.length} {editedScript.scenes.length === 1 ? "cena" : "cenas"}
          </Badge>
        </h3>

        {editedScript.scenes.map((scene, index) => {
          const sceneType = SCENE_TYPE_LABELS[scene.type] || { label: scene.type, color: "bg-gray-500" }
          const isExpanded = expandedScenes.has(scene.scene_id)
          const sceneVideo = sceneVideos.get(scene.scene_id)
          const isGenerating = generatingScenes.has(scene.scene_id)

          return (
            <Card key={scene.scene_id} className="bg-white/5 border-gray-700 p-6">
              {/* Scene Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎬</span>
                  <div>
                    <h4 className="text-lg font-semibold">Cena {scene.scene_id}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${sceneType.color} text-white`}>{sceneType.label}</Badge>
                      <span className="text-sm text-gray-400">{scene.duration_seconds}s</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleScene(scene.scene_id)}
                  className="text-gray-400 hover:text-white"
                >
                  {isExpanded ? "Ocultar Prompt" : "Ver Prompt"}
                </Button>
              </div>

              {/* Video Prompt (Collapsible) */}
              {isExpanded && (
                <div className="mb-4 p-4 bg-black/50 border border-gray-700 rounded-lg">
                  <label className="text-sm font-medium text-gray-400 block mb-2">Video Prompt (EN):</label>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{scene.video_prompt_en}</p>
                </div>
              )}

              {/* Audio Script (Editable) */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Script de Áudio (PT-BR): <span className="text-xs text-gray-500">(editável)</span>
                </label>
                <textarea
                  value={scene.audio_script_pt}
                  onChange={(e) => handleSceneChange(index, "audio_script_pt", e.target.value)}
                  className="w-full min-h-[80px] p-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              {/* Direction Notes (Editable) */}
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Notas de Direção: <span className="text-xs text-gray-500">(editável)</span>
                </label>
                <input
                  type="text"
                  value={scene.direction_notes}
                  onChange={(e) => handleSceneChange(index, "direction_notes", e.target.value)}
                  className="w-full h-10 px-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-white italic text-sm"
                />
              </div>

              {/* Video Generation Section */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Vídeo Gerado:
                </label>

                {/* No video yet - show generate button */}
                {!sceneVideo && !isGenerating && (
                  <Button
                    onClick={() => handleGenerateVideo(scene.scene_id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🎬 Gerar Vídeo
                  </Button>
                )}

                {/* Generating state */}
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center p-8 bg-black/50 border border-gray-700 rounded-lg">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="text-sm text-gray-300">Gerando vídeo...</p>
                    <p className="text-xs text-gray-500 mt-1">Isso pode levar até 10 minutos</p>
                  </div>
                )}

                {/* Video complete - show player */}
                {sceneVideo && sceneVideo.status === "complete" && (sceneVideo.video_base64 || sceneVideo.video_url) && (
                  <div className="space-y-3">
                    <video
                      src={sceneVideo.video_base64 || sceneVideo.video_url || undefined}
                      controls
                      className="w-full rounded-lg border border-gray-600"
                      style={{ maxHeight: "400px" }}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownloadVideo(scene.scene_id, sceneVideo)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white hover:bg-white/10"
                      >
                        ⬇️ Download
                      </Button>
                      <Button
                        onClick={() => {
                          toast.info("Funcionalidade de deletar vídeo em breve")
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-500 hover:bg-red-500/10"
                      >
                        🗑️ Deletar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {sceneVideo && sceneVideo.status === "error" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">
                      ❌ Erro ao gerar vídeo: {sceneVideo.error_message || "Unknown error"}
                    </p>
                    <Button
                      onClick={() => handleGenerateVideo(scene.scene_id)}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-600 text-red-500 hover:bg-red-500/10"
                    >
                      🔄 Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {hasChanges && (
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
            💾 Salvar Edições
          </Button>
        )}
        <Button onClick={handleCopyJSON} variant="outline" className="border-gray-600 text-white hover:bg-white/10">
          📋 Copiar JSON
        </Button>
        <Button onClick={handleDownloadJSON} variant="outline" className="border-gray-600 text-white hover:bg-white/10">
          ⬇️ Download JSON
        </Button>
      </div>

      {/* JSON Preview (Optional) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
          🔍 Ver JSON Completo
        </summary>
        <pre className="mt-2 p-4 bg-black/50 border border-gray-700 rounded-lg text-xs text-gray-300 overflow-x-auto">
          {JSON.stringify(editedScript, null, 2)}
        </pre>
      </details>
    </div>
  )
}
