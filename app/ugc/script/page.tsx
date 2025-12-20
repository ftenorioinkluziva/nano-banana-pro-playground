"use client"

import { useState } from "react"
import { ScriptForm } from "@/components/ugc/script-form"
import { ScriptViewer } from "@/components/ugc/script-viewer"
import { ScriptHistory } from "@/components/ugc/script-history"
import type { ScriptOutput } from "@/lib/agents/script-generator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Tab = "create" | "history"

export default function ScriptGeneratorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("create")
  const [generatedScript, setGeneratedScript] = useState<ScriptOutput | null>(null)
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleScriptGenerated = (script: ScriptOutput, id: string) => {
    setGeneratedScript(script)
    setScriptId(id)
    toast.success("Roteiro gerado com sucesso!")
  }

  const handleScriptChange = async (updatedScript: ScriptOutput) => {
    if (!scriptId) {
      toast.error("Erro: ID do roteiro não encontrado")
      return
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
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

      setGeneratedScript(updatedScript)
      toast.success("Roteiro atualizado com sucesso!")
    } catch (error) {
      console.error("Error updating script:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar roteiro")
    }
  }

  const handleNewScript = () => {
    setGeneratedScript(null)
    setScriptId(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Gerador de Roteiro UGC</h1>
          <p className="text-gray-400">
            Crie roteiros estruturados para vídeos UGC com IA. Gere prompts para ferramentas de vídeo e scripts de áudio
            em português.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("create")}
              className={cn(
                "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
                activeTab === "create"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              )}
            >
              ✨ Criar Roteiro
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
                activeTab === "history"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              )}
            >
              📚 Histórico
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column: Form */}
            <div className="space-y-6">
              <ScriptForm
                onScriptGenerated={handleScriptGenerated}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                disabled={!!generatedScript}
              />
              {generatedScript && (
                <button
                  onClick={handleNewScript}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-gray-600"
                >
                  ✨ Gerar Novo Roteiro
                </button>
              )}
            </div>

            {/* Right Column: Preview/Result */}
            <div className="space-y-6">
              {!generatedScript && !isGenerating && (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium">Aguardando geração de roteiro</p>
                    <p className="text-sm mt-1">Preencha o formulário ao lado e clique em "Gerar Roteiro"</p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="text-lg font-medium">Gerando roteiro...</p>
                    <p className="text-sm text-gray-400 mt-1">Isso pode levar até 30 segundos</p>
                  </div>
                </div>
              )}

              {generatedScript && (
                <ScriptViewer
                  script={generatedScript}
                  scriptId={scriptId}
                  onScriptChange={handleScriptChange}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && <ScriptHistory />}
      </div>
    </div>
  )
}
