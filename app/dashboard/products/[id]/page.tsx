import { notFound } from "next/navigation"
import { ProductForm } from "../_components/product-form"
import { createClient } from "@/utils/supabase/server"

interface ProductPageProps {
  params: {
    id: string
  }
}

// async function getProduct(id: string) {
//   console.log("iddd",id)
//   const supabase = createClient()

//   const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

//   if (error || !data) {
//     return null
//   }

//   return data
// }


export default async function EditProductPage({ params }: ProductPageProps) {
  const { id } = await params
 

  console.log("params",params)
  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
      <ProductForm productId={id} />
    </div>
  )
}
