"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { ScriptOutput, ScriptScene } from "@/lib/agents/script-generator"
import { useLanguage } from "@/components/language-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, RefreshCw } from "lucide-react"
import { AVAILABLE_MODELS } from "@/lib/video-models-config"

interface SceneVideo {
  id: string
  video_url: string | null
  video_base64: string | null
  status: "generating" | "complete" | "error"
  error_message?: string
  task_id?: string
  created_at: string
  completed_at?: string
  model?: string
  aspect_ratio?: string
  resolution?: string
}

interface ScriptViewerProps {
  script: ScriptOutput
  scriptId: string | null
  onScriptChange: (updatedScript: ScriptOutput) => void
}

export function ScriptViewer({ script, scriptId, onScriptChange }: ScriptViewerProps) {
  const { t } = useLanguage()

  const SCENE_TYPE_LABELS = {
    hook: { label: "Hook", color: "bg-purple-500" },
    solution: { label: "Solução", color: "bg-blue-500" },
    benefit: { label: "Benefício", color: "bg-green-500" },
    cta: { label: "CTA", color: "bg-orange-500" },
  }

  const [editedScript, setEditedScript] = useState<ScriptOutput>(script)
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [sceneVideos, setSceneVideos] = useState<Map<number, SceneVideo>>(new Map())
  const [generatingScenes, setGeneratingScenes] = useState<Set<number>>(new Set())

  // Video Generation Settings State
  const [videoSettings, setVideoSettings] = useState({
    modelId: "veo3_fast", // Default to Veo Fast
    aspectRatio: "9:16",
    resolution: "720p"
  })

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
    toast.success(t.jsonCopied)
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
    toast.success(t.jsonDownloaded)
  }

  const handleGenerateVideo = async (sceneId: number) => {
    if (!scriptId) {
      toast.error(t.errorUpdatingScript)
      return
    }

    // Mark scene as generating
    setGeneratingScenes(prev => new Set(prev).add(sceneId))

    try {
      const response = await fetch(
        `/api/scripts/${scriptId}/scenes/${sceneId}/generate-video`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: videoSettings.modelId,
            aspectRatio: videoSettings.aspectRatio,
            resolution: videoSettings.resolution
          })
        }
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

      toast.success(`${t.videoGeneratedSuccessfully} ${sceneId}`)
    } catch (error) {
      console.error(`Error generating video for scene ${sceneId}:`, error)
      toast.error(error instanceof Error ? error.message : t.errorGeneratingScript)
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
      toast.error(t.videoNotAvailable)
      return
    }

    const a = document.createElement("a")
    a.href = videoSource
    a.download = `cena-${sceneId}-${scriptId}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(t.downloadStarted)
  }

  // Storyboard handling
  const [storyboardVideo, setStoryboardVideo] = useState<SceneVideo | null>(null)
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false)

  const handleGenerateStoryboard = async () => {
    if (!scriptId) return
    if (!confirm(`Generate full storyboard video? This costs between 150-270 credits.`)) return

    setIsGeneratingStoryboard(true)
    try {
      const res = await fetch(`/api/scripts/${scriptId}/generate-storyboard`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStoryboardVideo(data.sceneVideo)
      toast.success("Storyboard video generation started!")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsGeneratingStoryboard(false)
    }
  }

  useEffect(() => {
    if (sceneVideos.has(0)) {
      setStoryboardVideo(sceneVideos.get(0)!)
    }
  }, [sceneVideos])

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{editedScript.product_name}</h2>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 border-purple-500/50 hover:bg-purple-500/10 text-purple-200">
              <Settings2 className="w-4 h-4" />
              Configurações de Vídeo
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-zinc-950 border-zinc-800 text-white p-5 shadow-2xl">
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-white">Configurações de Geração</h4>
                <p className="text-[11px] text-zinc-400">Aplicadas a novas gerações de cena</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <span className="text-purple-400">🤖</span> Modelo
                  </label>
                  <Select
                    value={videoSettings.modelId}
                    onValueChange={(val) => setVideoSettings(prev => ({ ...prev, modelId: val }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      {AVAILABLE_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id} className="focus:bg-zinc-800 focus:text-white">
                          {model.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <span className="text-blue-400">📐</span> Proporção
                  </label>
                  <Select
                    value={videoSettings.aspectRatio}
                    onValueChange={(val) => setVideoSettings(prev => ({ ...prev, aspectRatio: val }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="9:16" className="focus:bg-zinc-800 focus:text-white">9:16 (Vertical - Reels/TikTok)</SelectItem>
                      <SelectItem value="16:9" className="focus:bg-zinc-800 focus:text-white">16:9 (Horizontal - YouTube)</SelectItem>
                      <SelectItem value="1:1" className="focus:bg-zinc-800 focus:text-white">1:1 (Quadrado - Feed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <span className="text-green-400">🖥️</span> Resolução
                  </label>
                  <Select
                    value={videoSettings.resolution}
                    onValueChange={(val) => setVideoSettings(prev => ({ ...prev, resolution: val }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="720p" className="focus:bg-zinc-800 focus:text-white">720p HD</SelectItem>
                      <SelectItem value="1080p" className="focus:bg-zinc-800 focus:text-white">1080p Full HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Project Summary */}
      <Card className="bg-white/5 border-gray-700 p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📝</div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">{t.projectSummary}</h3>
            <p className="text-lg text-white">{editedScript.project_summary}</p>
          </div>
        </div>
      </Card>

      {/* Full Storyboard Video */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📽️</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Full Storyboard Video (Sora 2 Pro)</h3>
              <p className="text-sm text-gray-400">Generate a complete video from all scenes using Sora 2 Pro Storyboard.</p>
            </div>
          </div>
        </div>

        {!storyboardVideo && !isGeneratingStoryboard && (
          <Button
            onClick={handleGenerateStoryboard}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6"
          >
            ✨ Generate Full Video (150-270 Credits)
          </Button>
        )}

        {isGeneratingStoryboard && (
          <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <p className="text-sm text-gray-300">Generating storyboard video...</p>
          </div>
        )}

        {storyboardVideo && storyboardVideo.status === 'complete' && (
          <div className="space-y-3">
            <video
              src={storyboardVideo.video_url || storyboardVideo.video_base64 || undefined}
              controls
              className="w-full rounded-lg shadow-2xl border border-purple-500/30"
            />
            <Button
              variant="outline"
              onClick={() => handleDownloadVideo(0, storyboardVideo)}
              className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/20"
            >
              ⬇️ Download Storyboard Video
            </Button>
          </div>
        )}

        {storyboardVideo && storyboardVideo.status === 'error' && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm">
            Error: {storyboardVideo.error_message}
            <Button variant="link" onClick={handleGenerateStoryboard} className="text-red-300 underline">Retry</Button>
          </div>
        )}
      </Card>

      {/* Scenes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span>{t.scenes}</span>
          <Badge variant="secondary" className="bg-white/10">
            {editedScript.scenes.length} {t.scenesCount}
          </Badge>
        </h3>

        {editedScript.scenes.map((scene, index) => {
          const sceneType = SCENE_TYPE_LABELS[scene.type as keyof typeof SCENE_TYPE_LABELS] || { label: scene.type, color: "bg-gray-500" }
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
                    <h4 className="text-lg font-semibold">{t.scene} {scene.scene_id}</h4>
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
                  {isExpanded ? t.hidePrompt : t.showPrompt}
                </Button>
              </div>

              {/* Video Prompt (Collapsible) */}
              {isExpanded && (
                <div className="mb-4 p-4 bg-black/50 border border-gray-700 rounded-lg">
                  <label className="text-sm font-medium text-gray-400 block mb-2">{t.visualPrompt} (EN):</label>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{scene.video_prompt_en}</p>
                </div>
              )}

              {/* Audio Script (Editable) */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  {t.audioScriptEditable}: <span className="text-xs text-gray-500">({t.edit.toLowerCase()})</span>
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
                  {t.directionNotesEditable}: <span className="text-xs text-gray-500">({t.edit.toLowerCase()})</span>
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
                  {t.generatedVideo}:
                </label>

                {/* No video yet - show generate button */}
                {!sceneVideo && !isGenerating && (
                  <Button
                    onClick={() => handleGenerateVideo(scene.scene_id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🎬 {t.generateVideo}
                  </Button>
                )}

                {/* Generating state */}
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center p-8 bg-black/50 border border-gray-700 rounded-lg">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="text-sm text-gray-300">{t.generating}...</p>
                    <p className="text-xs text-gray-500 mt-1">{t.itMayTake10Min}</p>
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
                        ⬇️ {t.download}
                      </Button>
                      <Button
                        onClick={() => {
                          toast.info("Funcionalidade de deletar vídeo em breve")
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-500 hover:bg-red-500/10"
                      >
                        🗑️ {t.delete}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {sceneVideo && sceneVideo.status === "error" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">
                      ❌ {t.error}: {sceneVideo.error_message || "Unknown error"}
                    </p>
                    <Button
                      onClick={() => handleGenerateVideo(scene.scene_id)}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-600 text-red-500 hover:bg-red-500/10"
                    >
                      🔄 {t.retry}
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
            💾 {t.saveEdits}
          </Button>
        )}
        <Button onClick={handleCopyJSON} variant="outline" className="border-gray-600 text-white hover:bg-white/10">
          📋 {t.copyJSON}
        </Button>
        <Button onClick={handleDownloadJSON} variant="outline" className="border-gray-600 text-white hover:bg-white/10">
          ⬇️ {t.downloadJSON}
        </Button>
      </div>

      {/* JSON Preview (Optional) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
          🔍 {t.viewFullJSON}
        </summary>
        <pre className="mt-2 p-4 bg-black/50 border border-gray-700 rounded-lg text-xs text-gray-300 overflow-x-auto">
          {JSON.stringify(editedScript, null, 2)}
        </pre>
      </details>
    </div>
  )
}
