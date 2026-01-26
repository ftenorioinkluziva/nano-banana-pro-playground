"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react"
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

interface Product {
  id: number
  name: string
  description: string | null
  image_url: string | null
  target_audience: string | null
  brand_id: number | null
  brand_name: string | null
  brand_tone: string | null
  created_at: string
}

interface ProductListProps {
  onEdit: (product: Product) => void
  refreshTrigger?: number
}

export function ProductList({ onEdit, refreshTrigger }: ProductListProps) {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error(t.loadingProductsError)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error(t.loadingProductsError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [refreshTrigger, t.loadingProductsError])

  const handleDelete = async (id: number) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(t.deleteProductError)
      toast.success(t.productDeleted)
      setDeleteId(null)
      fetchProducts()
    } catch (error) {
      toast.error(t.deleteProductError)
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

  if (products.length === 0) {
    return (
      <Card className="bg-black/50 border-zinc-800">
        <CardContent className="py-8 text-center text-zinc-400">
          {t.noProductsYet}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-black/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t.yourProducts}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-black/50 border border-zinc-800"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-zinc-600" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium text-white truncate">{product.name}</h3>

                {product.description && (
                  <p className="text-sm text-zinc-400 line-clamp-1">
                    {product.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {product.brand_name && (
                    <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
                      {product.brand_name}
                    </span>
                  )}
                  {product.target_audience && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 truncate max-w-[200px]">
                      {product.target_audience}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  className="hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(product.id)}
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
