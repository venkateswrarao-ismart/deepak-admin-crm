"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Trash2, Download } from "lucide-react"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
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
import { toast } from "sonner"
// First, add the import for Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// First, add the Switch import at the top of the file with other imports
import { Switch } from "@/components/ui/switch"

function ProductsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-36 bg-muted rounded animate-pulse" />
      <div className="border rounded-md h-[400px] bg-muted animate-pulse" />
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  // Then, add a state variable for the active tab after the other state declarations
  const [activeTab, setActiveTab] = useState("all")
  // Add state for user authentication data
  const [authData, setAuthData] = useState(null)

  useEffect(() => {
    // Safely access localStorage only on the client side
    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (authDataString) {
        const parsedAuthData = JSON.parse(authDataString)
        setAuthData(parsedAuthData)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("products")
          .select(`
          id, 
          name, 
          price, 
          stock, 
          selling_price,
          category,
          brand,
          approval_status,
          created_at,
          image_url,
          article_id,
          discount_percentage,
          mrp,
          isactive,
          cost_price
        `)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching products:", error)
          return
        }

        setProducts(data || [])

        // Check for tab query parameter and set active tab
        const urlParams = new URLSearchParams(window.location.search)
        const tabParam = urlParams.get("tab")
        if (tabParam && ["all", "in_stock", "low_stock", "critical_stock"].includes(tabParam)) {
          setActiveTab(tabParam)
        }
      } catch (err) {
        console.error("Failed to fetch products:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  async function deleteProduct(id) {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // First delete related product images
      await supabase.from("product_images").delete().eq("product_id", id)

      // Then delete the product
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Remove the product from the state
      setProducts(products.filter((product) => product.id !== id))
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  function exportToExcel() {
    try {
      // Prepare data for export - remove unnecessary columns and format values
      const exportData = products.map((product) => ({
        "Article ID": product.article_id || "",
        Name: product.name || "",
        MRP: product.price || 0,
        "Selling Price": product.selling_price || 0,
        "Cost Price": product.cost_price || "-",
        Stock: product.stock || 0,
        Category: product.category || "Uncategorized",
        Brand: product.brand || "",
        Discount: product.discount_percentage || 0,
        Status: product.approval_status || "pending",
        "IsActive": product.isactive || "False",
        "Created At": product.created_at ? new Date(product.created_at).toLocaleDateString() : "",
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Create Blob and download
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `products-export-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Products data has been exported to Excel.",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      })
    }
  }

  // Add a function to filter products by stock level after the exportToExcel function
  function getFilteredProducts() {
    switch (activeTab) {
      case "low_stock":
        return products.filter((product) => product.stock > 0 && product.stock <= 10)
      case "critical_stock":
        return products.filter((product) => product.stock === 0)
      case "in_stock":
        return products.filter((product) => product.stock > 10)
      default:
        return products
    }
  }

  // Get the filtered products based on the active tab
  const filteredProducts = getFilteredProducts()

  const columns = [
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.getValue("image_url") || "/placeholder.svg?height=40&width=40"
        return (
          <div className="w-10 h-10 relative rounded-md overflow-hidden">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={row.getValue("name") || "Product"}
              className="object-cover w-full h-full"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=40&width=40"
              }}
            />
          </div>
        )
      },
    },
    {
      accessorKey: "article_id",
      header: "Article ID",
      cell: ({ row }) => {
        return row.getValue("article_id") || "—"
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "price",
      header: "MRP",
      cell: ({ row }) => {
        try {
          const price = Number.parseFloat(row.getValue("price") || "0")
          const formatted = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(price)
          return formatted
        } catch (error) {
          return "₹0.00"
        }
      },
    },
    {
      accessorKey: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => {
        try {
          const price = Number.parseFloat(row.getValue("selling_price") || "0")
          const formatted = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(price)
          return formatted
        } catch (error) {
          return "₹0.00"
        }
      },
    },
    {
      accessorKey: "cost_price",
      header: "Cost Price",
      cell: ({ row }) => {
        try {
          const price = row.getValue("cost_price")

          // Return a dash for null values
          if (price === null || price === undefined) return "—"

          const formatted = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(Number.parseFloat(price))

          return formatted
        } catch (error) {
          console.error("Error formatting cost price:", error)
          return "—"
        }
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        return row.getValue("stock") || 0
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        return row.getValue("category") || "Uncategorized"
      },
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => {
        return row.getValue("brand") || "—"
      },
    },
    {
      accessorKey: "discount_percentage",
      header: "Discount",
      cell: ({ row }) => {
        return row.getValue("discount_percentage") || "—"
      },
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("approval_status") || "pending"

        const statusStyles = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        }

        const style = statusStyles[status] || "bg-gray-100 text-gray-800"

        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>{status}</span>
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        try {
          return formatDate(row.getValue("created_at"))
        } catch (error) {
          return "—"
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.original?.id
        const isActive = row.original?.isactive !== false // Default to true if null

        if (!id) return null

        const toggleActiveStatus = async (checked) => {
          try {
            const supabase = createClient()
            const { error } = await supabase.from("products").update({ isactive: checked }).eq("id", id)

            if (error) throw error

            // Update the local state to reflect the change
            const updatedProducts = products.map((product) =>
              product.id === id ? { ...product, isactive: checked } : product,
            )
            setProducts(updatedProducts)

            toast({
              title: checked ? "Product activated" : "Product deactivated",
              description: `The product has been ${checked ? "activated" : "deactivated"}.`,
            })
          } catch (error) {
            console.error("Error updating product status:", error)
            toast({
              title: "Error",
              description: "Failed to update product status.",
              variant: "destructive",
            })
          }
        }

        const allowedAdminIds = [
        
          "905cb410-5a83-409d-833a-5bc0d2fec983",
          "118de4f6-0322-4301-b521-7f46c50eb3cd",
          "d347bd21-e42b-4f63-ae12-b7589617b527",
          "67e10586-72fc-4daa-9488-d62dae229332"
        ]

        const isAdmin = allowedAdminIds.includes(authData?.user?.id)

        return (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href={`/dashboard/products/${id}`}>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/products/view/${id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
            <div className="flex items-center gap-1 ml-2">
              <Switch
                checked={isActive}
                onCheckedChange={toggleActiveStatus}
                aria-label={`Set product ${isActive ? "inactive" : "active"}`}
              />
              <span className="text-xs text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={(e) => {
                e.preventDefault()
                setProductToDelete(row.original)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  // Update the return statement to include the Tabs component
  // Replace the existing return statement with this:
  return (
    <div className="space-y-4 p-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Articles(Products)</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={isLoading || products.length === 0}
            className="flex items-center justify-center h-9 px-3 text-sm whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Export</span>
          </Button>
          <Link href="/dashboard/products/new">
            <Button className="bg-orange-500 hover:bg-orange-600 h-9 px-3 text-sm whitespace-nowrap flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <TabsTrigger value="all" className="min-w-0 text-xs sm:text-sm whitespace-nowrap px-2">
            <span className="truncate">All Products</span>
            <span className="ml-1 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{products.length}</span>
          </TabsTrigger>
          <TabsTrigger value="in_stock" className="min-w-0 text-xs sm:text-sm whitespace-nowrap px-2">
            <span className="truncate">In Stock</span>
            <span className="ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">
              {products.filter((p) => p.stock > 10).length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="low_stock" className="min-w-0 text-xs sm:text-sm whitespace-nowrap px-2">
            <span className="truncate">Low Stock</span>
            <span className="ml-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">
              {products.filter((p) => p.stock > 0 && p.stock <= 10).length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="critical_stock" className="min-w-0 text-xs sm:text-sm whitespace-nowrap px-2">
            <span className="truncate">Out of Stock</span>
            <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs">
              {products.filter((p) => p.stock === 0).length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="!mt-[3.5rem]">
          {isLoading ? (
            <ProductsTableSkeleton />
          ) : (
            <div className="mt-4 sm:mt-6 md:mt-4">
              <DataTable
                columns={columns}
                data={filteredProducts}
                searchColumn="name"
                searchPlaceholder="Search products..."
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "
              {productToDelete?.name || "Unnamed Product"}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (productToDelete) {
                  deleteProduct(productToDelete.id)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
