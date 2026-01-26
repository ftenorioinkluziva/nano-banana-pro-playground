
"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Type matches lib/usage-costs.ts
type DetailedCostConfig = {
    default: number
    [key: string]: number
}

type CostConfig = {
    VIDEO: {
        DEFAULT: number
        MODELS: Record<string, number | DetailedCostConfig>
    }
    IMAGE: {
        DEFAULT: number
        MODELS: Record<string, number | DetailedCostConfig>
    }
    PROMPT_ENHANCEMENT: number
}

export function UsageCostsEditor() {
    const [config, setConfig] = useState<CostConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Fetch config
    useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/admin/usage-costs")
                if (!res.ok) {
                    throw new Error("Failed to fetch configuration")
                }
                const data = await res.json()
                setConfig(data)
            } catch (error) {
                console.error(error)
                toast.error("Could not load usage costs. Using defaults might be unexpected.")
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        if (!config) return
        setSaving(true)
        try {
            const res = await fetch("/api/admin/usage-costs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            })

            if (!res.ok) {
                throw new Error("Failed to save configuration")
            }

            const data = await res.json()
            // Update local state with returned data (optional, to sync)
            if (data.data) setConfig(data.data)

            toast.success("Usage costs updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    // Helper to update simple number fields
    const updateField = (path: string[], value: number) => {
        if (!config) return
        const newConfig = { ...config }
        let current: any = newConfig
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]]
        }
        current[path[path.length - 1]] = value
        setConfig(newConfig)
    }

    // Model List Editor Helper
    const ModelListEditor = ({
        type,
        models,
        onUpdate
    }: {
        type: "IMAGE" | "VIDEO",
        models: Record<string, number | DetailedCostConfig>,
        onUpdate: (newModels: Record<string, number | DetailedCostConfig>) => void
    }) => {
        const [newModelName, setNewModelName] = useState("")
        const [newModelCost, setNewModelCost] = useState(type === "IMAGE" ? 5 : 50)

        const addModel = () => {
            if (!newModelName.trim()) return
            if (models[newModelName]) {
                toast.error("Model already exists")
                return
            }
            onUpdate({ ...models, [newModelName]: newModelCost })
            setNewModelName("")
        }

        const removeModel = (key: string) => {
            const { [key]: _, ...rest } = models
            onUpdate(rest)
        }

        const updateModelCost = (key: string, cost: number) => {
            const current = models[key]
            if (typeof current === 'object') {
                onUpdate({ ...models, [key]: { ...current, default: cost } })
            } else {
                onUpdate({ ...models, [key]: cost })
            }
        }

        const toggleAdvanced = (key: string) => {
            const current = models[key]
            if (typeof current === 'number') {
                // Switch to object
                onUpdate({ ...models, [key]: { default: current } })
            } else {
                // Switch to simple (lossy if they have other keys)
                // Only warn if they actually have overrides
                if (Object.keys(current).length > 1) {
                    if (!confirm("Converting to simple mode will lose specific variant prices. Continue?")) return
                }
                onUpdate({ ...models, [key]: current.default })
            }
        }

        const updateVariant = (modelKey: string, variantKey: string, val: number) => {
            const model = models[modelKey]
            if (typeof model !== 'object') return
            onUpdate({ ...models, [modelKey]: { ...model, [variantKey]: val } })
        }

        const removeVariant = (modelKey: string, variantKey: string) => {
            const model = models[modelKey]
            if (typeof model !== 'object') return
            const { [variantKey]: _, ...rest } = model
            onUpdate({ ...models, [modelKey]: rest })
        }

        const addVariant = (modelKey: string, variantKey: string, val: number) => {
            const model = models[modelKey]
            if (typeof model !== 'object') return
            onUpdate({ ...models, [modelKey]: { ...model, [variantKey]: val } })
        }

        return (
            <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-[1fr_100px_40px] gap-2 items-end">
                        <div className="space-y-1">
                            <Label>Add New Model</Label>
                            <Input
                                placeholder="Model ID (e.g. flux-pro)"
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Default Cost</Label>
                            <Input
                                type="number"
                                value={newModelCost}
                                onChange={(e) => setNewModelCost(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={addModel} disabled={!newModelName.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {Object.entries(models).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No specific model costs configured.</p>
                    )}
                    {Object.entries(models).map(([modelId, costConfig]) => {
                        const isAdvanced = typeof costConfig === 'object'
                        const defaultVal = isAdvanced ? costConfig.default : costConfig

                        return (
                            <div key={modelId} className="border rounded-md p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Input value={modelId} disabled className="flex-1 font-mono text-sm bg-muted/50" />
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground block px-1">Default Cost</span>
                                        <Input
                                            type="number"
                                            className="w-24"
                                            value={defaultVal}
                                            onChange={(e) => updateModelCost(modelId, parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant={isAdvanced ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => toggleAdvanced(modelId)}
                                            title={isAdvanced ? "Switch to Simple Mode" : "Switch to Advanced Mode"}
                                            className="h-8"
                                        >
                                            {isAdvanced ? "Adv" : "Simple"}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => removeModel(modelId)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {isAdvanced && (
                                    <div className="pl-4 border-l-2 border-muted ml-2 space-y-2">
                                        <Label className="text-xs text-muted-foreground">Variants (Type, Resolution)</Label>
                                        {Object.entries(costConfig).map(([vKey, vVal]) => {
                                            if (vKey === "default") return null
                                            return (
                                                <div key={vKey} className="flex gap-2 items-center">
                                                    <Input
                                                        value={vKey}
                                                        className="flex-1 h-8 text-sm"
                                                        disabled
                                                    />
                                                    <Input
                                                        type="number"
                                                        className="w-20 h-8"
                                                        value={vVal as number}
                                                        onChange={(e) => updateVariant(modelId, vKey, parseInt(e.target.value) || 0)}
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeVariant(modelId, vKey)}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                        <div className="flex gap-2 items-center pt-1">
                                            <Input
                                                placeholder="Variant Key (e.g. text-to-video, 4k)"
                                                className="flex-1 h-8 text-sm"
                                                id={`new-variant-${modelId}`}
                                            />
                                            <Input
                                                type="number"
                                                className="w-20 h-8"
                                                defaultValue={defaultVal}
                                                id={`new-val-${modelId}`}
                                            />
                                            <Button variant="outline" size="sm" className="h-8" onClick={() => {
                                                const kInput = document.getElementById(`new-variant-${modelId}`) as HTMLInputElement
                                                const vInput = document.getElementById(`new-val-${modelId}`) as HTMLInputElement
                                                if (kInput.value) {
                                                    addVariant(modelId, kInput.value, parseInt(vInput.value) || 0)
                                                    kInput.value = ""
                                                }
                                            }}>Add</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    if (!config) return <div>Error loading configuration</div>

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="sticky top-4 z-10 flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Image Generation Costs */}
            <Card>
                <CardHeader>
                    <CardTitle>Image Generation</CardTitle>
                    <CardDescription>Default costs and specific model overrides for image generation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="image-default">Default Cost (Credits)</Label>
                        <Input
                            type="number"
                            id="image-default"
                            value={config.IMAGE.DEFAULT}
                            onChange={(e) => updateField(["IMAGE", "DEFAULT"], parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <Separator />

                    <ModelListEditor
                        type="IMAGE"
                        models={config.IMAGE.MODELS}
                        onUpdate={(newModels) => {
                            setConfig({
                                ...config,
                                IMAGE: { ...config.IMAGE, MODELS: newModels }
                            })
                        }}
                    />
                </CardContent>
            </Card>

            {/* Video Generation Costs */}
            <Card>
                <CardHeader>
                    <CardTitle>Video Generation</CardTitle>
                    <CardDescription>Default costs and specific model overrides for video generation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="video-default">Default Cost (Credits)</Label>
                        <Input
                            type="number"
                            id="video-default"
                            value={config.VIDEO.DEFAULT}
                            onChange={(e) => updateField(["VIDEO", "DEFAULT"], parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <Separator />

                    <ModelListEditor
                        type="VIDEO"
                        models={config.VIDEO.MODELS}
                        onUpdate={(newModels) => {
                            setConfig({
                                ...config,
                                VIDEO: { ...config.VIDEO, MODELS: newModels }
                            })
                        }}
                    />
                </CardContent>
            </Card>

            {/* Other Costs */}
            <Card>
                <CardHeader>
                    <CardTitle>Other Costs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="prompt-enhancement">Prompt Enhancement Cost</Label>
                        <Input
                            type="number"
                            id="prompt-enhancement"
                            value={config.PROMPT_ENHANCEMENT}
                            onChange={(e) => updateField(["PROMPT_ENHANCEMENT"], parseInt(e.target.value) || 0)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
