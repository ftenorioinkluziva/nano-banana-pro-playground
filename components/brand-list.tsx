"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/components/language-provider"

interface Brand {
  id: number
  name: string
  tone: string | null
  description: string | null
  created_at: string
}

interface BrandListProps {
  onEdit: (brand: Brand) => void
  refreshTrigger?: number
}

export function BrandList({ onEdit, refreshTrigger }: BrandListProps) {
  const { t } = useLanguage()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchBrands = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/brands")
      if (!response.ok) throw new Error(t.loadingBrandsError)
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      toast.error(t.loadingBrandsError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [refreshTrigger, t.loadingBrandsError])

  const handleDelete = async (id: number) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/brands/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(t.deleteBrandError)
      toast.success(t.brandDeleted)
      setDeleteId(null)
      fetchBrands()
    } catch (error) {
      toast.error(t.deleteBrandError)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-black/50 border-zinc-800">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    )
  }

  if (brands.length === 0) {
    return (
      <Card className="bg-black/50 border-zinc-800">
        <CardContent className="py-8 text-center text-zinc-400">
          {t.noBrandsYet}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-black/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t.yourBrands}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-start justify-between p-4 rounded-lg bg-black/50 border border-zinc-800"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{brand.name}</h3>
                  {brand.tone && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-900/50 text-blue-300 uppercase font-bold tracking-wider">
                      {t[`tone${brand.tone.charAt(0).toUpperCase() + brand.tone.slice(1)}`] || brand.tone}
                    </span>
                  )}
                </div>
                {brand.description && (
                  <p className="text-sm text-zinc-400 line-clamp-1">
                    {brand.description}
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  {t.created}: {new Date(brand.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(brand)}
                  className="hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(brand.id)}
                  className="hover:bg-red-900/50 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t.deleteVideoWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
              disabled={isDeleting}
            >
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
