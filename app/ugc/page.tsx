"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Video, Sparkles } from "lucide-react";
import UGCGenerationHistory from "@/components/ugc/generation-history";
import GenerateVideoDialog from "@/components/ugc/generate-video-dialog";
import {
  AppErrorBoundary,
  CenteredSpinner,
  NoProductsEmptyState,
} from "@/components/shared";
import { useLanguage } from "@/components/language-provider"

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  target_audience: string;
  category?: string;
  price?: number;
  ingredients?: string;
  benefits?: any;
}

export default function UGCPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id.toString() === productId);
    setSelectedProduct(product || null);
  };

  const handleGenerateClick = () => {
    if (selectedProduct) {
      setShowDialog(true);
    }
  };

  if (loading) {
    return (
      <AppErrorBoundary>
        <div className="flex items-center justify-center min-h-screen bg-black">
          <CenteredSpinner message={t.loading} />
        </div>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-white">
              <Video className="h-8 w-8" />
              {t.ugcTitle}
            </h1>
            <p className="text-muted-foreground">
              {t.ugcSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Selection */}
            <div className="lg:col-span-1">
              <Card className="bg-black/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">{t.selectProduct}</CardTitle>
                  <CardDescription>{t.chooseProductForUGC}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {products.length === 0 ? (
                    <NoProductsEmptyState />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="product-select" className="text-white">{t.products}</Label>
                        <Select value={selectedProductId} onValueChange={handleProductSelect}>
                          <SelectTrigger id="product-select" className="bg-black border-gray-800 text-white">
                            <SelectValue placeholder={t.selectBrand} />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-gray-800 text-white">
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedProduct && (
                        <div className="space-y-4 pt-4 border-t border-gray-800">
                          {/* Product Preview */}
                          {selectedProduct.image_url && (
                            <img
                              src={selectedProduct.image_url}
                              alt={selectedProduct.name}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          )}

                          <div>
                            <h3 className="font-semibold text-lg text-white">{selectedProduct.name}</h3>
                            {selectedProduct.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedProduct.description}
                              </p>
                            )}
                          </div>

                          {selectedProduct.target_audience && (
                            <div>
                              <Label className="text-xs text-muted-foreground">{t.targetAudience}</Label>
                              <Badge variant="secondary" className="mt-1 block w-fit">
                                {selectedProduct.target_audience}
                              </Badge>
                            </div>
                          )}

                          <Button
                            className="w-full h-10 md:h-12 text-sm md:text-base font-semibold !bg-white !text-black hover:!bg-gray-200"
                            onClick={handleGenerateClick}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t.generateVideo}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generation History */}
            <div className="lg:col-span-2">
              <UGCGenerationHistory />
            </div>
          </div>

          {/* Generate Video Dialog */}
          {selectedProduct && (
            <GenerateVideoDialog
              product={selectedProduct}
              open={showDialog}
              onOpenChange={setShowDialog}
            />
          )}
        </div>
      </div>
    </AppErrorBoundary>
  );
}
