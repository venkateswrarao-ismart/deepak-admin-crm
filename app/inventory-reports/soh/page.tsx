"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, RefreshCw, Search, Plus, X, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Vendor = Database["public"]["Tables"]["vendors"]["Row"]

export default function SOHReportPage() {
  const supabase = createClientComponentClient<Database>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterVendor, setFilterVendor] = useState("all")

  // Add these state variables
  const [showForm, setShowForm] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Initial form state
  const initialFormState = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category_id: "",
    vendor_id: "",
    brand: "",
    hsn_code: "",
  }

  const [formData, setFormData] = useState(initialFormState)

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      if (editingId) {
        // Update existing product
        const result = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            stock: formData.stock,
            category_id: formData.category_id || null,
            vendor_id: formData.vendor_id || null,
            brand: formData.brand || null,
            hsn_code: formData.hsn_code || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)

        if (result.error) throw result.error

        toast({
          title: "Success",
          description: "Product stock updated successfully",
        })

        setEditingId(null)
      } else {
        // Create new product
        const result = await supabase.from("products").insert({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category_id: formData.category_id || null,
          vendor_id: formData.vendor_id || null,
          brand: formData.brand || null,
          hsn_code: formData.hsn_code || null,
        })

        if (result.error) throw result.error

        toast({
          title: "Success",
          description: "New product created successfully",
        })
      }

      // Reset form and refresh data
      setFormData(initialFormState)
      setShowForm(false)
      fetchProductData()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  const fetchProductData = async () => {
    setLoading(true)

    try {
      // Fetch products data
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          stock,
          category,
          category_id,
          vendor_id,
          brand,
          hsn_code,
          image_url,
          approval_status,
          created_at,
          updated_at
        `)
        .order("name")

      if (productsError) {
        console.error("Error fetching products data:", productsError)
        return
      }

      // Fetch categories for filtering
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .is("parent_id", null)
        .order("name")

      if (categoryError) {
        console.error("Error fetching categories:", categoryError)
      } else {
        setCategories(categoryData || [])
      }

      // Fetch vendors for filtering
      const { data: vendorData, error: vendorError } = await supabase.from("vendors").select("id, name").order("name")

      if (vendorError) {
        console.error("Error fetching vendors:", vendorError)
      } else {
        setVendors(vendorData || [])
      }

      setProducts(productsData || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchProductData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchProductData()
  }

  const handleExportCSV = () => {
    setLoading(true)

    try {
      // Filter the data based on current filters
      const filteredData = getFilteredProducts()

      // Convert to CSV
      const headers = [
        "Product ID",
        "Product Name",
        "Current Stock",
        "Price",
        "Category",
        "Brand",
        "HSN Code",
        "Status",
        "Last Updated",
      ]

      const csvRows = [
        headers.join(","),
        ...filteredData.map((item) =>
          [
            `"${item.id}"`,
            `"${item.name}"`,
            item.stock,
            item.price,
            `"${getCategoryName(item.category_id) || item.category || ""}"`,
            `"${item.brand || ""}"`,
            `"${item.hsn_code || ""}"`,
            `"${getStockStatus(item.stock).label}"`,
            new Date(item.updated_at || "").toLocaleString(),
          ].join(","),
        ),
      ]

      const csvString = csvRows.join("\n")

      // Create a download link
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `stock_report_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return { label: "Out of Stock", color: "destructive" }
    } else if (stock < 10) {
      return { label: "Low Stock", color: "warning" }
    } else {
      return { label: "In Stock", color: "success" }
    }
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null
    const category = categories.find((c) => c.id === categoryId)
    return category?.name
  }

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return null
    const vendor = vendors.find((v) => v.id === vendorId)
    return vendor?.name
  }

  // Filter the data based on search term and filters
  const getFilteredProducts = () => {
    return products.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "in_stock" && item.stock > 10) ||
        (filterStatus === "low_stock" && item.stock > 0 && item.stock <= 10) ||
        (filterStatus === "out_of_stock" && item.stock <= 0)

      const matchesCategory = filterCategory === "all" || item.category_id === filterCategory

      const matchesVendor = filterVendor === "all" || item.vendor_id === filterVendor

      return matchesSearch && matchesStatus && matchesCategory && matchesVendor
    })
  }

  const filteredProducts = getFilteredProducts()

  const handleEdit = (item: Product) => {
    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price || 0,
      stock: item.stock || 0,
      category_id: item.category_id || "",
      vendor_id: item.vendor_id || "",
      brand: item.brand || "",
      hsn_code: item.hsn_code || "",
    })
    setEditingId(item.id)
    setShowForm(true)
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      // Refresh the data
      fetchProductData()
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Product Entry Form */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingId ? "Edit Product Stock" : "Add New Product"}</CardTitle>
              <CardDescription>Manage product inventory information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Hide Form" : "Add Product"}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input
                    id="hsn_code"
                    value={formData.hsn_code || ""}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData(initialFormState)
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                  {!formSubmitting && <Save className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock on Hand (SOH) Report</h2>
          <p className="text-muted-foreground">View and manage current inventory levels</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory Levels</CardTitle>
          <CardDescription>Monitor stock levels and identify products that need replenishment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportCSV} disabled={loading} className="gap-2 whitespace-nowrap">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Loading data...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((item) => {
                      const status = getStockStatus(item.stock)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id?.substring(0, 8)}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.stock}</TableCell>
                          <TableCell>₹{item.price.toFixed(2)}</TableCell>
                          <TableCell>{getCategoryName(item.category_id) || item.category || "-"}</TableCell>
                          <TableCell>{item.brand || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status.color as
                                  | "default"
                                  | "destructive"
                                  | "outline"
                                  | "secondary"
                                  | "success"
                                  | "warning"
                              }
                              className={`
                                ${status.color === "success" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                                ${status.color === "warning" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}
                                ${status.color === "destructive" ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}
                              `}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="h-8 px-2 text-blue-600"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id as string)}
                                className="h-8 px-2 text-red-600"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
