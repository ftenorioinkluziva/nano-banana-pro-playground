"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Video, Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import UGCGenerationHistory from "@/components/ugc/generation-history";
import GenerateVideoDialog from "@/components/ugc/generate-video-dialog";

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  target_audience: string;
  category: string;
  price: number;
}

export default function UGCPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleGenerateClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Video className="h-8 w-8" />
          UGC Video Generator
        </h1>
        <p className="text-muted-foreground">
          Generate AI-powered user-generated content videos for your products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Select a product to generate UGC video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No products found. Create a product first.
                </p>
              ) : (
                products.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleGenerateClick(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {product.description}
                          </p>
                          {product.target_audience && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {product.target_audience}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateClick(product);
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Video
                      </Button>
                    </CardContent>
                  </Card>
                ))
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
  );
}
