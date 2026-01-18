"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import type { CapabilityFull } from "@/types/capability"

export default function CapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<CapabilityFull[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCapability, setEditingCapability] = useState<CapabilityFull | null>(null)
  const [formData, setFormData] = useState({
    id: "",
    label: "",
    description: "",
    icon_name: "video",
    base_prompt_template: "",
    recommended_aspect_ratio: "9:16" as "16:9" | "9:16",
    default_negative_prompt: "",
    generation_type: "TEXT_2_VIDEO" as "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO",
  })

  useEffect(() => {
    fetchCapabilities()
  }, [])

  const fetchCapabilities = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/capabilities?includeInactive=true")
      const data = await response.json()
      setCapabilities(data.capabilities || [])
    } catch (error) {
      console.error("Error fetching capabilities:", error)
      toast.error("Failed to load capabilities")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCapability(null)
    setFormData({
      id: "",
      label: "",
      description: "",
      icon_name: "video",
      base_prompt_template: "",
      recommended_aspect_ratio: "9:16",
      default_negative_prompt: "",
      generation_type: "TEXT_2_VIDEO",
    })
    setShowDialog(true)
  }

  const handleEdit = (capability: CapabilityFull) => {
    setEditingCapability(capability)
    setFormData({
      id: capability.id,
      label: capability.label,
      description: capability.description,
      icon_name: capability.icon_name,
      base_prompt_template: capability.base_prompt_template,
      recommended_aspect_ratio: capability.recommended_aspect_ratio,
      default_negative_prompt: capability.default_negative_prompt || "",
      generation_type: capability.generation_type,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      const url = editingCapability
        ? `/api/capabilities/${editingCapability.id}`
        : "/api/capabilities"

      const method = editingCapability ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          editingCapability
            ? "Capability updated successfully"
            : "Capability created successfully"
        )
        setShowDialog(false)
        fetchCapabilities()
      } else {
        toast.error(data.error || "Failed to save capability")
      }
    } catch (error) {
      console.error("Error saving capability:", error)
      toast.error("Failed to save capability")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this capability?")) {
      return
    }

    try {
      const response = await fetch(`/api/capabilities/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Capability deleted successfully")
        fetchCapabilities()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete capability")
      }
    } catch (error) {
      console.error("Error deleting capability:", error)
      toast.error("Failed to delete capability")
    }
  }

  const handleToggleActive = async (capability: CapabilityFull) => {
    try {
      const response = await fetch(`/api/capabilities/${capability.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !capability.is_active }),
      })

      if (response.ok) {
        toast.success(
          capability.is_active
            ? "Capability deactivated"
            : "Capability activated"
        )
        fetchCapabilities()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update capability")
      }
    } catch (error) {
      console.error("Error updating capability:", error)
      toast.error("Failed to update capability")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Capabilities Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage video generation styles and templates
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Capability
        </Button>
      </div>

      <div className="grid gap-4">
        {capabilities.map((capability) => (
          <Card key={capability.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {capability.label}
                    {!capability.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline">{capability.generation_type}</Badge>
                    <Badge variant="outline">{capability.recommended_aspect_ratio}</Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {capability.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>ID: {capability.id}</span>
                    <span>•</span>
                    <span>Icon: {capability.icon_name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleActive(capability)}
                  >
                    {capability.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(capability)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(capability.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-semibold">Prompt Template:</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                    {capability.base_prompt_template}
                  </pre>
                </div>
                {capability.default_negative_prompt && (
                  <div>
                    <Label className="text-sm font-semibold">Negative Prompt:</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {capability.default_negative_prompt}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog*/}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCapability ? "Edit Capability" : "Create New Capability"}
            </DialogTitle>
            <DialogDescription>
              Configure the video generation style and template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID (slug)</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="ugc-selfie-v2"
                disabled={!!editingCapability}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (cannot be changed after creation)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="UGC Selfie Hiper-Realista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Selfie ultra-realista com especificações técnicas..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="generation_type">Generation Type</Label>
                <Select
                  value={formData.generation_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, generation_type: value })
                  }
                >
                  <SelectTrigger id="generation_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT_2_VIDEO">TEXT_2_VIDEO</SelectItem>
                    <SelectItem value="FIRST_AND_LAST_FRAMES_2_VIDEO">
                      FIRST_AND_LAST_FRAMES_2_VIDEO
                    </SelectItem>
                    <SelectItem value="REFERENCE_2_VIDEO">
                      REFERENCE_2_VIDEO
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
                <Select
                  value={formData.recommended_aspect_ratio}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, recommended_aspect_ratio: value })
                  }
                >
                  <SelectTrigger id="aspect_ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_name">Icon Name (Lucide React)</Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                placeholder="smartphone, camera, video, film, sparkles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_prompt_template">
                Base Prompt Template
              </Label>
              <Textarea
                id="base_prompt_template"
                value={formData.base_prompt_template}
                onChange={(e) =>
                  setFormData({ ...formData, base_prompt_template: e.target.value })
                }
                placeholder="Subject: A realistic person...
Action: Speaking enthusiastically...
Camera: Front-facing smartphone...
Lighting: Ring light reflection...
Style: UGC, TikTok viral aesthetic..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders like {`{ProductName}`} and {`{UserIntent}`} for dynamic content
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="negative_prompt">Default Negative Prompt (Optional)</Label>
              <Textarea
                id="negative_prompt"
                value={formData.default_negative_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, default_negative_prompt: e.target.value })
                }
                placeholder="cartoon, illustration, 3d render, ugly, deformed"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCapability ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
