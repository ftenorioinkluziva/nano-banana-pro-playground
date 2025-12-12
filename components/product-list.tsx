"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { CenteredSpinner, NoProductsEmptyState } from "@/components/shared"

interface Product {
  id: number
  name: string
  slug: string | null
  price: string | null
  category: string | null
  format: string | null
  quantity_label: string | null
  description: string | null
  usage_instructions: string | null
  contraindications: string | null
  ingredients: string | null
  benefits: any
  nutritional_info: any
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductListProps {
  onEdit: (product: Product) => void
  refreshTrigger?: number
}

export function ProductList({ onEdit, refreshTrigger }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products")

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [refreshTrigger])

  const handleDelete = async (id: number) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete product")
      }

      toast.success("Product deleted successfully!")
      setDeleteId(null)
      fetchProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatPrice = (price: string | null) => {
    if (!price) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(price))
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-black/50 border-gray-800">
        <CardContent className="flex items-center justify-center py-12">
          <CenteredSpinner message="Loading products..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Products List</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <NoProductsEmptyState />
          ) : (
            <div className="rounded-md border border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-700">
                    <TableHead className="text-zinc-300">Name</TableHead>
                    <TableHead className="text-zinc-300">Category</TableHead>
                    <TableHead className="text-zinc-300">Price</TableHead>
                    <TableHead className="text-zinc-300">Format</TableHead>
                    <TableHead className="text-zinc-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-gray-800 hover:bg-gray-700">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div>{product.name}</div>
                            {product.slug && (
                              <div className="text-xs text-zinc-500">{product.slug}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {product.category || "-"}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {product.format || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(product)}
                            className="hover:bg-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(product.id)}
                            className="hover:bg-red-950 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the product
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
