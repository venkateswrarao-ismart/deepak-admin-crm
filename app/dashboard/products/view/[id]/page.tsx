import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { ProductImageGallery } from "./ProductImageGallery" // Import the new component

interface ProductViewPageProps {
  params: {
    id: string
  }
}

async function getProductWithImages(id: string) {
  const supabase = createClient()

  // Get product details
  const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", id).single()

  if (productError || !product) {
    return null
  }

  // Get product images
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("is_primary", { ascending: false })

  if (imagesError) {
    console.error("Error fetching product images:", imagesError)
  }

  return {
    ...product,
    images: images || [],
  }
}

export default async function ProductViewPage({ params }: ProductViewPageProps) {
  const product = await getProductWithImages(params.id)

  if (!product) {
    notFound()
  }

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  const statusStyle = statusStyles[product.approval_status as keyof typeof statusStyles] || ""

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageGallery images={product.images} productName={product.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
           <div>
             <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
             <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
                {product.approval_status}
              </span>
            </div>

           <div>
              <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
              <p className="text-lg font-semibold">
               {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(product.price)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Stock</h3>
              <p>{product.stock} units</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
              <p>{product.category}</p>
            </div>

            {product.brand && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Brand</h3>
                <p>{product.brand}</p>
              </div>
            )}

            {product.hsn_code && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">HSN Code</h3>
                <p>{product.hsn_code}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{formatDate(product.created_at)}</p>
            </div>

            {product.updated_at && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p>{formatDate(product.updated_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rest of your description card... */}

       <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          {product.description ? (
            <p className="whitespace-pre-wrap">{product.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description provided</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
