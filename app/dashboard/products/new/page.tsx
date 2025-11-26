import { ProductForm } from "../_components/product-form"

export default function NewProductPage() {
  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
      <ProductForm />
    </div>
  )
}
