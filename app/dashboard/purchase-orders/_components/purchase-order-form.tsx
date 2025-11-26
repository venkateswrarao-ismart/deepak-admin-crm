"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Download, Printer, Pencil, Search, ChevronDown, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Add these imports at the top of the file
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

interface PurchaseOrder {
  id: string
  vendor_id: string
  vendor_code: string | null
  vendor_name: string | null
  vendor_address: string | null
  vendor_phone: string | null
  vendor_email: string | null
  vendor_gst: string | null
  payment_terms: "0-3 days" | "4-7 days" | "8-15 days" | "16-30 days" | "more than 30 days"
  rtv: "Yes" | "No"
  po_status: "Created" | "Approved" | "Cancelled" | "Completed" | "Dispatched" | "Delivered" | null
  validity_date: string | null
  items?: PurchaseOrderItem[]
  created_at?: string | null
  inbound_status?: string | null
  // New payment fields
  payment_status?:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "Scheduled"
    | "Partially Paid"
    | "Paid"
    | "Overdue"
    | "Cancelled"
  payment_method?:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "upi"
    | "net_banking"
    | "wallet"
    | "Bank Tranfer"
    | "Cheque"
    | "Other"
  payment_due_date?: string | null
  payment_scheduled_date?: string | null
  payment_reference?: string | null
  payment_notes?: string | null
  partial_payment_amount?: number | null
  total_payment_amount?: number | null
  custom_payment_terms?: string | null
}

interface PurchaseOrderItem {
  id?: string | number // Make sure this includes string or number type for the ID
  po_id?: string
  article_id: string // Changed from product_id to article_id to match DB schema
  article_code?: string | null
  article_text?: string | null
  cost_price: number
  mrp: number
  ordered_quantity: number
  received_quantity?: number
  uom?: string | null
  gst_percentage?: number
  hsn_code?: string | null
}

interface Vendor {
  id: string
  name: string
}

interface Product {
  id: string
  article_id: string
  name: string
  price: number
  stock: number
  brand: string | null
  hsn_code: string | null
  category: string | null
  description: string | null
  gst_percentage: number | null
  mrp: number | null
  cost_price: number | null
  unit_of_measurement: string | null
}

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder
  vendors: Vendor[]
}

export function PurchaseOrderForm({ purchaseOrder, vendors }: PurchaseOrderFormProps) {
  // Local storage key for this form
  const STORAGE_KEY = "purchase-order-form-data"

  // Save form data to localStorage
  const saveFormState = () => {
    if (purchaseOrder) return // Don't save if editing existing PO

    const formData = {
      vendorId,
      paymentTerms,
      rtv,
      poStatus,
      validityDate: validityDate ? validityDate.toISOString() : null,
      orderItems,
      paymentStatus,
      paymentMethod,
      paymentDueDate: paymentDueDate ? paymentDueDate.toISOString() : null,
      paymentScheduledDate: paymentScheduledDate ? paymentScheduledDate.toISOString() : null,
      paymentReference,
      paymentNotes,
      partialPaymentAmount,
      totalPaymentAmount,
      customPaymentTerms,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }

  // Load form data from localStorage
  const loadFormState = () => {
    if (purchaseOrder) return // Don't load if editing existing PO

    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (!savedData) return

      const formData = JSON.parse(savedData)

      // Set form state from saved data
      if (formData.vendorId) setVendorId(formData.vendorId)
      if (formData.paymentTerms) setPaymentTerms(formData.paymentTerms)
      if (formData.rtv) setRtv(formData.rtv)
      if (formData.poStatus) setPoStatus(formData.poStatus)
      if (formData.validityDate) setValidityDate(new Date(formData.validityDate))
      if (formData.orderItems) setOrderItems(formData.orderItems)
      if (formData.paymentStatus) setPaymentStatus(formData.paymentStatus)
      if (formData.paymentMethod) setPaymentMethod(formData.paymentMethod)
      if (formData.paymentDueDate) setPaymentDueDate(new Date(formData.paymentDueDate))
      if (formData.paymentScheduledDate) setPaymentScheduledDate(new Date(formData.paymentScheduledDate))
      if (formData.paymentReference) setPaymentReference(formData.paymentReference)
      if (formData.paymentNotes) setPaymentNotes(formData.paymentNotes)
      if (formData.partialPaymentAmount) setPartialPaymentAmount(formData.partialPaymentAmount)
      if (formData.totalPaymentAmount) setTotalPaymentAmount(formData.totalPaymentAmount)
      if (formData.customPaymentTerms) setCustomPaymentTerms(formData.customPaymentTerms)
    } catch (error) {
      console.error("Error loading form state from localStorage:", error)
    }
  }

  // Clear form data from localStorage
  const clearFormState = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    clearFormState()
    setShowCancelDialog(false)
    router.push("/dashboard/purchase-orders")
  }

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [vendorId, setVendorId] = useState(purchaseOrder?.vendor_id || "")
  const [paymentTerms, setPaymentTerms] = useState<
    "0-3 days" | "4-7 days" | "8-15 days" | "16-30 days" | "more than 30 days"
  >(purchaseOrder?.payment_terms || "8-15 days")
  const [rtv, setRtv] = useState<"Yes" | "No">(purchaseOrder?.rtv || "No")
  const [poStatus, setPoStatus] = useState<
    "Created" | "Approved" | "Cancelled" | "Completed" | "Dispatched" | "Delivered"
  >(purchaseOrder?.po_status || "Created")
  const [validityDate, setValidityDate] = useState<Date | undefined>(
    purchaseOrder?.validity_date ? new Date(purchaseOrder.validity_date) : undefined,
  )
  // We'll no longer use a global GST percentage, but will use article-specific GST percentages
  const [loading, setLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<string>("")
  const [editablePrice, setEditablePrice] = useState<string>("")
  const [editableUOM, setEditableUOM] = useState<string>("")
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  const printRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const [paymentStatus, setPaymentStatus] = useState<
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "Scheduled"
    | "Partially Paid"
    | "Paid"
    | "Overdue"
    | "Cancelled"
  >(purchaseOrder?.payment_status || "pending")

  const [paymentMethod, setPaymentMethod] = useState<
    | "cash"
    | "credit_card"
    | "debit_card"
    | "upi"
    | "net_banking"
    | "wallet"
    | "Bank Tranfer"
    | "Cheque"
    | "Other"
    | undefined
  >(purchaseOrder?.payment_method)

  const [paymentDueDate, setPaymentDueDate] = useState<Date | undefined>(
    purchaseOrder?.payment_due_date ? new Date(purchaseOrder.payment_due_date) : undefined,
  )

  const [paymentScheduledDate, setPaymentScheduledDate] = useState<Date | undefined>(
    purchaseOrder?.payment_scheduled_date ? new Date(purchaseOrder.payment_scheduled_date) : undefined,
  )

  const [paymentReference, setPaymentReference] = useState(purchaseOrder?.payment_reference || "")
  const [paymentNotes, setPaymentNotes] = useState(purchaseOrder?.payment_notes || "")
  const [partialPaymentAmount, setPartialPaymentAmount] = useState(purchaseOrder?.partial_payment_amount || 0)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(purchaseOrder?.total_payment_amount || 0)
  const [customPaymentTerms, setCustomPaymentTerms] = useState(purchaseOrder?.custom_payment_terms || "")
  const [remainingAmount, setRemainingAmount] = useState(0)

  const [paymentDueDateOpen, setPaymentDueDateOpen] = useState(false)
  const [paymentScheduledDateOpen, setPaymentScheduledDateOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  // Function to highlight matched text
  const highlightMatch = (text: string, query: string): { text: string; highlight: boolean }[] => {
    if (!query.trim()) return [{ text, highlight: false }]

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, i) => ({
      text: part,
      highlight: i % 2 === 1, // Every odd index is a match
    }))
  }

  // Fetch products when vendor is selected
  useEffect(() => {
    if (vendorId) {
      fetchProducts()
      fetchVendorDetails()
    }
  }, [vendorId])

  // Fetch existing order items if editing
  useEffect(() => {
    if (purchaseOrder?.id) {
      fetchOrderItems(purchaseOrder.id)
    }
  }, [purchaseOrder])

  // Calculate the grand total from order items
  useEffect(() => {
    if (orderItems.length > 0) {
      const { grandTotal } = calculateTotals()

      // Always update total payment amount when grand total changes
      // unless there's a partial payment (which has its own logic)
      if (partialPaymentAmount === 0) {
        setTotalPaymentAmount(grandTotal)
      }
    } else {
      // If there are no items, set total payment amount to 0
      setTotalPaymentAmount(0)
    }
  }, [orderItems, partialPaymentAmount])

  // Update remaining amount when partial payment changes
  useEffect(() => {
    const { grandTotal } = calculateTotals()

    // If partial payment is entered, calculate remaining amount
    if (partialPaymentAmount > 0) {
      const remaining = grandTotal - partialPaymentAmount
      setRemainingAmount(remaining > 0 ? remaining : 0)

      // Update total payment amount to be the grand total
      if (totalPaymentAmount !== grandTotal) {
        setTotalPaymentAmount(grandTotal)
      }

      // Set payment status to "Partially Paid" if not already set
      if (paymentStatus !== "Partially Paid" && paymentStatus !== "Paid") {
        setPaymentStatus("Partially Paid")
      }
    } else {
      // If no partial payment, set remaining amount to 0
      setRemainingAmount(0)
    }
  }, [partialPaymentAmount, orderItems])

  // Fetch products from the database filtered by vendor
  const fetchProducts = async () => {
    setLoadingArticles(true)
    try {
      console.log("Fetching products for vendor ID:", vendorId)

      // First, get all article_ids associated with this vendor from vendor_articlestwo table
      const { data: vendorArticlesData, error: vendorArticlesError } = await supabase
        .from("vendor_articlestwo")
        .select("article_id")
        .eq("vendor_id", vendorId)

      if (vendorArticlesError) {
        console.error("Error fetching vendor articles:", vendorArticlesError)
        throw vendorArticlesError
      }

      if (!vendorArticlesData || vendorArticlesData.length === 0) {
        console.log("No articles found for this vendor")
        setProducts([])
        toast({
          title: "No products found",
          description: "No products are associated with this vendor.",
          variant: "warning",
        })
        return
      }

      // Extract article_ids from the result
      const articleIds = vendorArticlesData.map((item) => item.article_id)
      console.log(`Found ${articleIds.length} articles associated with vendor:`, articleIds)

      // Query the products table with the article_ids
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          "id, article_id, name, description, cost_price, mrp, hsn_code, unit_of_measurement, gst_percentage, category_id, stock, brand, category",
        )
        .in("article_id", articleIds)

      if (productsError) {
        console.error("Error fetching products:", productsError)
        throw productsError
      }

      if (productsData && productsData.length > 0) {
        // Map products data to match the products structure
        const mappedProducts = productsData.map((product) => ({
          id: product.id,
          article_id: product.article_id,
          name: product.name || "Unnamed Product",
          price: product.cost_price || 0,
          stock: product.stock || 0,
          brand: product.brand,
          hsn_code: product.hsn_code,
          category: product.unit_of_measurement || product.category, // Use unit_of_measurement or category
          description: product.description,
          gst_percentage: product.gst_percentage || 0,
          mrp: product.mrp !== null ? product.mrp : null,
          cost_price: product.cost_price,
          unit_of_measurement: product.unit_of_measurement,
        }))

        setProducts(mappedProducts)
        toast({
          title: "Products loaded",
          description: `Found ${mappedProducts.length} products for this vendor.`,
        })
      } else {
        // If no products found with direct vendor_id match, try a fallback approach
        console.log("No products found with direct article_id match, trying fallback approach")

        // Try to find products by vendor name or code
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("name, vendor_code")
          .eq("id", vendorId)
          .single()

        if (vendorData) {
          const searchTerms = [vendorData.name, vendorData.vendor_code].filter(Boolean)

          if (searchTerms.length > 0) {
            // Use OR conditions to search for products that might be related to this vendor
            let query = supabase
              .from("products")
              .select(
                "id, article_id, name, description, cost_price, mrp, hsn_code, unit_of_measurement, gst_percentage, category_id, stock, brand, category",
              )

            // Add search conditions
            for (const term of searchTerms) {
              if (term) {
                query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
              }
            }

            const { data: fallbackData, error: fallbackError } = await query

            if (!fallbackError && fallbackData && fallbackData.length > 0) {
              const mappedFallbackProducts = fallbackData.map((product) => ({
                id: product.id,
                article_id: product.article_id,
                name: product.name || "Unnamed Product",
                price: product.cost_price || 0,
                stock: product.stock || 0,
                brand: product.brand,
                hsn_code: product.hsn_code,
                category: product.unit_of_measurement || product.category,
                description: product.description,
                gst_percentage: product.gst_percentage || 0,
                mrp: product.mrp || 0,
                cost_price: product.cost_price,
                unit_of_measurement: product.unit_of_measurement,
              }))

              setProducts(mappedFallbackProducts)
              toast({
                title: "Products loaded (fallback)",
                description: `Found ${mappedFallbackProducts.length} products that might be related to this vendor.`,
                variant: "warning",
              })
              return
            }
          }
        }

        setProducts([])
        toast({
          title: "No products found",
          description: "No products found for this vendor. Please check vendor-product relationships.",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error fetching products",
        description: "Could not load products for this vendor. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoadingArticles(false)
    }
  }

  // Fetch vendor details
  const fetchVendorDetails = async () => {
    try {
      const { data } = await supabase.from("vendors").select("*").eq("id", vendorId).single()

      if (data) {
        setSelectedVendor(data)
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error)
    }
  }

  // Fetch existing order items
  const fetchOrderItems = async (poId: string) => {
    setLoadingItems(true)
    try {
      const { data, error } = await supabase.from("purchase_order_itemstwo").select("*").eq("po_id", poId)

      if (error) {
        console.error("Error fetching order items:", error)
        throw error
      }

      if (data && data.length > 0) {
        console.log("Fetched order items:", data)

        // Ensure all items have the correct types for their fields
        const processedItems = data.map((item) => ({
          ...item,
          id: item.id, // Preserve the ID as it comes from the database
          ordered_quantity: Number(item.ordered_quantity),
          received_quantity: item.received_quantity ? Number(item.received_quantity) : 0,
          cost_price: Number(item.cost_price),
          mrp: Number(item.mrp),
          gst_percentage: item.gst_percentage ? Number(item.gst_percentage) : 0,
        }))

        setOrderItems(processedItems)
      } else {
        console.log("No order items found for PO ID:", poId)
        setOrderItems([])
      }
    } catch (error) {
      console.error("Error fetching order items:", error)
      toast({
        title: "Error fetching order items",
        description: "Could not load order items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  // Handle editing an item
  const handleEditItem = (index: number) => {
    const item = orderItems[index]
    setSelectedProductId(item.article_id)
    const product = products.find((p) => p.article_id === item.article_id)
    setSelectedProduct(product || null)
    setQuantity(item.ordered_quantity.toString())
    setEditablePrice(item.cost_price.toString())
    setEditableUOM(item.uom || "")
    setEditingItemIndex(index)

    // Log the item for debugging
    console.log("Editing item:", item)
  }

  // Handle product selection
  const handleProductChange = (value: string) => {
    setSelectedProductId(value)
    const product = products.find((p) => p.article_id === value)
    setSelectedProduct(product || null)
    setQuantity("")
    setEditablePrice(product ? (product.cost_price || product.price).toString() : "")
    setEditableUOM(product?.unit_of_measurement || "")
  }

  // Add product to order
  const addProductToOrder = () => {
    if (selectedProduct) {
      // Convert quantity to number, default to 1 if empty
      const quantityNum = quantity ? Number.parseInt(quantity, 10) : 0

      // Convert price to number
      const priceNum = editablePrice
        ? Number.parseFloat(editablePrice)
        : selectedProduct.cost_price || selectedProduct.price

      // Validate quantity
      if (quantityNum <= 0) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid quantity greater than zero.",
          variant: "destructive",
        })
        return
      }

      // Validate price
      if (priceNum <= 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price greater than zero.",
          variant: "destructive",
        })
        return
      }

      // Use the product's actual MRP, only calculate if it's null or undefined
      let itemMrp = priceNum * 1.2 // Default calculation
      if (selectedProduct.mrp !== null && selectedProduct.mrp !== undefined) {
        itemMrp = selectedProduct.mrp
      }

      if (editingItemIndex !== null) {
        // Update existing item - preserve the ID if it exists
        const updatedItems = [...orderItems]
        const existingItem = updatedItems[editingItemIndex]

        // Make sure we preserve the ID exactly as it is
        updatedItems[editingItemIndex] = {
          id: existingItem.id, // Always keep the existing ID
          article_id: selectedProduct.article_id,
          article_text: selectedProduct.name,
          article_code: existingItem.article_code,
          cost_price: priceNum,
          mrp: itemMrp,
          ordered_quantity: quantityNum,
          received_quantity: existingItem.received_quantity || 0,
          uom: editableUOM || selectedProduct.unit_of_measurement || "",
          gst_percentage: selectedProduct.gst_percentage || 0,
          hsn_code: selectedProduct.hsn_code || null,
        }

        console.log("Updated item:", updatedItems[editingItemIndex])
        setOrderItems(updatedItems)
        setEditingItemIndex(null)
      } else {
        // Add new item without ID so the database can auto-assign it
        const newItem: PurchaseOrderItem = {
          article_id: selectedProduct.article_id,
          article_text: selectedProduct.name,
          cost_price: priceNum,
          mrp: itemMrp,
          ordered_quantity: quantityNum,
          received_quantity: 0,
          uom: editableUOM || selectedProduct.unit_of_measurement || "",
          gst_percentage: selectedProduct.gst_percentage || 0,
          hsn_code: selectedProduct.hsn_code || null,
        }

        console.log("New item to add:", newItem)
        setOrderItems([...orderItems, newItem])
      }

      setSelectedProductId("")
      setSelectedProduct(null)
      setQuantity("")
      setEditablePrice("")
      setEditableUOM("")
    }
  }

  // Remove article from order
  const removeArticle = (index: number) => {
    const newItems = [...orderItems]
    newItems.splice(index, 1)
    setOrderItems(newItems)
  }

  // Print the purchase order
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML
      const originalContents = document.body.innerHTML

      document.body.innerHTML = printContents
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  // Download as PDF
  const handleDownload = () => {
    setDialogOpen(true)
  }

  // Handle partial payment change
  const handlePartialPaymentChange = (value: number) => {
    setPartialPaymentAmount(value)

    // Calculate the grand total
    const { grandTotal } = calculateTotals()

    // Set the total payment amount to the grand total
    setTotalPaymentAmount(grandTotal)
  }

  // Validate purchase order item
  const validatePurchaseOrderItem = (item: PurchaseOrderItem): string | null => {
    if (!item.article_id) {
      return "Article ID is required"
    }

    if (!item.ordered_quantity || item.ordered_quantity <= 0) {
      return "Ordered quantity must be greater than zero"
    }

    if (!item.cost_price || item.cost_price <= 0) {
      return "Cost price must be greater than zero"
    }

    return null // No validation errors
  }

  // Load form state from localStorage on component mount
  useEffect(() => {
    loadFormState()
  }, [])

  // Save form state to localStorage whenever relevant state changes
  useEffect(() => {
    saveFormState()
  }, [
    vendorId,
    paymentTerms,
    rtv,
    poStatus,
    validityDate,
    orderItems,
    paymentStatus,
    paymentMethod,
    paymentDueDate,
    paymentScheduledDate,
    paymentReference,
    paymentNotes,
    partialPaymentAmount,
    totalPaymentAmount,
    customPaymentTerms,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Start a transaction
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("No session found, please log in again")
      }

      // Prepare purchase order data
      const poData = {
        vendor_id: vendorId,
        payment_terms: paymentTerms,
        rtv,
        po_status: poStatus,
        validity_date: validityDate ? validityDate.toISOString() : null,
        // Payment fields
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_due_date: paymentDueDate ? paymentDueDate.toISOString() : null,
        payment_scheduled_date: paymentScheduledDate ? paymentScheduledDate.toISOString() : null,
        payment_reference: paymentReference || null,
        payment_notes: paymentNotes || null,
        partial_payment_amount: partialPaymentAmount || null,
        total_payment_amount: totalPaymentAmount || null,
        custom_payment_terms: customPaymentTerms || null,
      }

      // Create or update purchase order
      let poId: string

      if (purchaseOrder) {
        // Update existing purchase order
        const { error: poError } = await supabase.from("purchase_orders").update(poData).eq("id", purchaseOrder.id)

        if (poError) {
          console.error("Error updating purchase order:", poError)
          throw poError
        }

        poId = purchaseOrder.id
      } else {
        // Create new purchase order
        const { data: newPo, error: poError } = await supabase.from("purchase_orders").insert(poData).select()

        if (poError || !newPo || newPo.length === 0) {
          console.error("Error creating purchase order:", poError)
          throw poError || new Error("Failed to create purchase order")
        }

        poId = newPo[0].id
      }

      // Handle order items if there are any
      if (orderItems.length > 0) {
        // Log the order items for debugging
        console.log("Processing order items:", orderItems)

        // More clearly separate existing items (those with IDs from the database)
        // from new items (those without IDs)
        const existingItems = orderItems.filter((item) => {
          // Check if item has a valid ID (could be number or string)
          return item.id !== undefined && item.id !== null && item.id !== ""
        })

        const newItems = orderItems.filter((item) => {
          // Items without an ID or with an empty ID are new
          return item.id === undefined || item.id === null || item.id === ""
        })

        console.log("Existing items to update:", existingItems)
        console.log("New items to insert:", newItems)

        // Validate all order items before submission
        for (const item of orderItems) {
          const validationError = validatePurchaseOrderItem(item)
          if (validationError) {
            toast({
              title: "Validation Error",
              description: `Error in item ${item.article_id}: ${validationError}`,
              variant: "destructive",
            })
            setLoading(false)
            return // Stop submission if there's a validation error
          }
        }

        // Update existing items if any
        if (existingItems.length > 0) {
          const itemsToUpdate = existingItems.map((item) => ({
            id: item.id,
            po_id: poId,
            article_id: item.article_id,
            article_code: item.article_code,
            article_text: item.article_text,
            cost_price: item.cost_price,
            mrp: item.mrp,
            ordered_quantity: item.ordered_quantity,
            received_quantity: item.received_quantity || 0,
            uom: item.uom || null,
            gst_percentage: item.gst_percentage || 0,
            hsn_code: item.hsn_code || null,
          }))

          console.log("Updating existing items:", itemsToUpdate)
          const { error: updateError } = await supabase
            .from("purchase_order_itemstwo")
            .upsert(itemsToUpdate, { onConflict: "id" })

          if (updateError) {
            console.error("Error updating existing items:", updateError)
            throw updateError
          }
        }

        // Insert new items if any
        if (newItems.length > 0) {
          // Never include ID for new items, let the database assign it
          const itemsToInsert = newItems.map((item) => ({
            po_id: poId,
            article_id: item.article_id,
            article_code: item.article_code,
            article_text: item.article_text,
            cost_price: item.cost_price,
            mrp: item.mrp,
            ordered_quantity: item.ordered_quantity,
            received_quantity: item.received_quantity || 0,
            uom: item.uom || null,
            gst_percentage: item.gst_percentage || 0,
            hsn_code: item.hsn_code || null,
          }))

          console.log("Inserting new items:", itemsToInsert)
          const { error: insertError } = await supabase.from("purchase_order_itemstwo").insert(itemsToInsert)

          if (insertError) {
            console.error("Error inserting new items:", insertError)
            throw insertError
          }
        }

        // Don't try to delete items when adding new ones to an existing PO
        // Only delete items if we're in a pure update scenario without new items
        if (purchaseOrder && newItems.length === 0) {
          const { data: currentItems, error: fetchError } = await supabase
            .from("purchase_order_itemstwo")
            .select("id")
            .eq("po_id", poId)

          if (fetchError) {
            console.error("Error fetching current items:", fetchError)
            throw fetchError
          }

          if (currentItems && currentItems.length > 0) {
            // Find items that exist in DB but not in our current list
            const currentIds = currentItems.map((item) => item.id)
            const updatedIds = existingItems
              .map((item) => {
                // Convert to number if it's a string, otherwise keep as is
                return typeof item.id === "string" ? Number.parseInt(item.id, 10) : item.id
              })
              .filter((id) => !isNaN(id)) // Filter out any NaN values

            const idsToDelete = currentIds.filter((id) => !updatedIds.includes(id))

            if (idsToDelete.length > 0) {
              console.log("Deleting items with IDs:", idsToDelete)

              const { error: deleteError } = await supabase
                .from("purchase_order_itemstwo")
                .delete()
                .in("id", idsToDelete)

              if (deleteError) {
                console.error("Error deleting removed items:", deleteError)
                throw deleteError
              }
            }
          }
        }
      }

      toast({
        title: purchaseOrder ? "Purchase Order updated" : "Purchase Order created",
        description: purchaseOrder
          ? "The purchase order has been updated successfully."
          : "The purchase order has been created successfully.",
      })

      // Clear saved form data after successful submission
      clearFormState()

      router.push("/dashboard/purchase-orders")
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the purchase order.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Calculate order totals with article-specific GST
  const calculateTotals = () => {
    let subtotal = 0

    orderItems.forEach((item) => {
      // Calculate item subtotal including GST
      const itemSubtotal = item.cost_price * item.ordered_quantity

      // Add to running subtotal
      subtotal += itemSubtotal
    })

    // Grand total is the same as subtotal since GST is included
    const grandTotal = subtotal
    return { subtotal, totalGst: 0, grandTotal }
  }

  const { subtotal, totalGst, grandTotal } = calculateTotals()

  // Format the payment scheduled date for display
  const formatPaymentScheduledDate = () => {
    // console.log("purchase order:", purchaseOrder)
    // For debugging
    console.log("Payment Scheduled Date:", purchaseOrder?.payment_scheduled_date)
    console.log("Payment Scheduled Date State:", paymentScheduledDate)

    // First try using the state variable which is set from the purchaseOrder prop
    if (paymentScheduledDate) {
      return format(paymentScheduledDate, "PPP")
    }

    // If that fails, try directly using the purchaseOrder prop
    if (purchaseOrder?.payment_scheduled_date) {
      try {
        return format(new Date(purchaseOrder.payment_scheduled_date), "PPP")
      } catch (error) {
        console.error("Error formatting payment_scheduled_date:", error)
      }
    }

    return "Not specified"
  }

  return (
    <form onSubmit={handleSubmit}>
      {(purchaseOrder || (vendorId && orderItems.length > 0)) && poStatus !== "Created" && (
        <div className="flex justify-end mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="flex items-center gap-1" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Purchase Order</DialogTitle>
                <DialogDescription>
                  Preview the purchase order document before printing or downloading
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" className="flex items-center gap-1" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </div>

              <div
                ref={printRef}
                className="p-3 bg-white text-base print:text-[12px] max-w-[210mm] mx-auto"
                style={{ lineHeight: 1.4 }}
              >
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold print:text-xl">PURCHASE ORDER</h1>
                </div>

                {/* Company Info */}
                <div className="flex border-b border-black p-1 mb-3">
                  <img
                    src="/ismart2-logo.png"
                    alt="Company Logo"
                    className="h-16 print:h-12 object-contain object-left mr-2"
                  />
                  <div className="flex flex-col gap-0.5 text-[12px] print:text-[10px]">
                    <div className="font-bold">ISMART SYSTEMS LLP</div>
                    <div>
                      <div className="font-semibold inline pr-1">Corporate Address:</div>
                      PLOT No.7, Y S RAO TOWERS, KAVURI HILLS (PHASE-1) MADHAPUR, HYDERABAD, Telangana - 500081
                    </div>
                    <div>
                      <div className="font-semibold inline pr-1">Warehouse Address:</div>
                      D.NO.12-44/4/A/1 SATHAMRAI, SHAMSHABAD, HYDERABAD, Telangana - 501218
                    </div>
                    <div>
                      <div className="font-semibold inline pr-1">GST:</div>
                      <div className="inline font-semibold">36AAJFI6467N1ZM</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mb-3 gap-2">
                  <div className="text-[12px] print:text-[10px]">
                    <h2 className="font-bold">Vendor Details:</h2>
                    <p className="font-semibold">{selectedVendor?.name || purchaseOrder?.vendor_name}</p>
                    <p>{selectedVendor?.address || purchaseOrder?.vendor_address}</p>
                    <p>Phone: {selectedVendor?.contact_number || purchaseOrder?.vendor_phone}</p>
                    <p>Email: {selectedVendor?.email || purchaseOrder?.vendor_email}</p>
                    <p>GST: {selectedVendor?.gst_number || purchaseOrder?.vendor_gst}</p>
                  </div>
                  <div className="text-[12px] print:text-[10px]">
                    <h2 className="font-bold">Order Details:</h2>
                    <p>PO Number: {purchaseOrder?.id || "New Order"}</p>
                    <p>Date: {formatDate(purchaseOrder?.created_at || new Date().toISOString())}</p>
                    <p>PO Validity Date: {validityDate ? format(validityDate, "PPP") : "Not specified"}</p>
                    <p>RTV: {rtv}</p>
                    <p>Payment Scheduled Date: {formatPaymentScheduledDate()}</p>
                    <p>GST: Article-specific rates applied</p>
                  </div>
                </div>

                <table
                  className="w-full border-collapse mb-3 text-[11px] print:text-[10px] border border-black"
                  style={{ borderSpacing: 0 }}
                >
                  <thead>
                    <tr>
                      <th className="border border-black p-0.5 text-left">Sl No.</th>
                      <th className="border border-black p-0.5 text-left">Description of Goods</th>
                      <th className="border border-black p-0.5 text-center">HSN/SAC</th>
                      <th className="border border-black p-0.5 text-right">Quantity</th>
                      <th className="border border-black p-0.5 text-right">Rate</th>
                      <th className="border border-black p-0.5 text-center">per</th>
                      <th className="border border-black p-0.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => {
                      const itemSubtotal = item.cost_price * item.ordered_quantity

                      return (
                        <tr key={index}>
                          <td className="border-l border-r border-black p-0.5 text-center">{index + 1}</td>
                          <td className="border-l border-r border-black p-0.5 text-left font-medium">
                            {item.article_text}
                          </td>
                          <td className="border-l border-r border-black p-0.5 text-center">{item.hsn_code || "-"}</td>
                          <td className="border-l border-r border-black p-0.5 text-right">
                            {item.ordered_quantity} {item.uom || ""}
                          </td>
                          <td className="border-l border-r border-black p-0.5 text-right">
                            {item.cost_price.toFixed(2)}
                          </td>
                          <td className="border-l border-r border-black p-0.5 text-center">{item.uom || "-"}</td>
                          <td className="border-l border-r border-black p-0.5 text-right">{itemSubtotal.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                    {/* Empty rows to fill space */}
                    {Array.from({ length: Math.max(0, 10 - orderItems.length) }).map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td className="border-l border-r border-black p-0.5">&nbsp;</td>
                        <td className="border-l border-r border-black p-0.5"></td>
                        <td className="border-l border-r border-black p-0.5"></td>
                        <td className="border-l border-r border-black p-0.5"></td>
                        <td className="border-l border-r border-black p-0.5"></td>
                        <td className="border-l border-r border-black p-0.5"></td>
                        <td className="border-l border-r border-black p-0.5"></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={6} className="border-l border-r border-t border-black p-0.5 text-right font-medium">
                        Subtotal (Including GST):
                      </td>
                      <td className="border-l border-r border-t border-black p-0.5 text-right">
                        ₹{subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="border-l border-r border-black p-0.5 text-right font-bold">
                        Total:
                      </td>
                      <td className="border-l border-r border-black p-0.5 text-right font-bold">
                        ₹{grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 flex justify-between text-[12px] print:text-[10px]">
                  <div>
                    <p className="font-bold">Authorized Signature</p>
                    <div className="mt-4 border-t border-black w-24"></div>
                  </div>
                  <div>
                    <p className="font-bold">Vendor Signature</p>
                    <div className="mt-4 border-t border-black w-24"></div>
                  </div>
                </div>

                <div className="mt-4 text-[11px] print:text-[10px]">
                  <p>Terms and Conditions:</p>
                  <ol className="list-decimal pl-4 mt-1">
                    <li>All goods must be delivered as per the specifications mentioned above.</li>
                    <li>Payment will be processed as per the payment terms mentioned in this order.</li>
                    <li>Any discrepancy in quality or quantity will result in rejection of goods.</li>
                    <li>Delivery must be made within the agreed timeframe.</li>
                    {validityDate && <li>This purchase order is valid until {format(validityDate, "PPP")}.</li>}
                  </ol>
                </div>

                <div className="mt-2 text-center text-[11px] print:text-[10px] text-gray-500">
                  <p>www.ismartinventory.com</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId} disabled={!!purchaseOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {vendorId && (
            <div className="space-y-2">
              <Label htmlFor="validity-date">PO Validity Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="validity-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validityDate ? format(validityDate, "PPP") : <span>Select validity date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validityDate}
                    onSelect={(date) => {
                      setValidityDate(date)
                      setCalendarOpen(false) // Close the calendar after selection
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">The date until which this purchase order is valid.</p>
            </div>
          )}

          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Add Products</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Select Product</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={loadingArticles}
                    >
                      {selectedProductId
                        ? products.find((product) => product.article_id === selectedProductId)?.name ||
                          "Select a product"
                        : loadingArticles
                          ? "Loading products..."
                          : products.length === 0
                            ? "No products found for this vendor"
                            : "Select a product"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="flex items-center border-b px-3 py-2">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button variant="ghost" onClick={() => setSearchQuery("")} className="h-8 px-2 py-1">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Command>
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {products
                            .filter((product) =>
                              (product.name?.toLowerCase() || "")
                                .concat(product.article_id?.toLowerCase() || "")
                                .concat(product.brand?.toLowerCase() || "")
                                .includes(searchQuery.toLowerCase()),
                            )
                            .map((product) => {
                              // Create parts for highlighting matched text
                              const nameParts = highlightMatch(product.name || "", searchQuery)
                              const articleParts = highlightMatch(product.article_id || "", searchQuery)
                              const brandParts = product.brand ? highlightMatch(product.brand, searchQuery) : null

                              return (
                                <CommandItem
                                  key={product.article_id}
                                  value={product.article_id}
                                  onSelect={() => {
                                    handleProductChange(product.article_id)
                                    setSearchQuery("")
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <div>
                                      {articleParts.map((part, i) => (
                                        <span key={i} className={part.highlight ? "bg-yellow-200 font-medium" : ""}>
                                          {part.text}
                                        </span>
                                      ))}
                                      {" - "}
                                      {nameParts.map((part, i) => (
                                        <span key={i} className={part.highlight ? "bg-yellow-200 font-medium" : ""}>
                                          {part.text}
                                        </span>
                                      ))}
                                    </div>
                                    {brandParts && (
                                      <div className="text-xs text-muted-foreground">
                                        Brand:{" "}
                                        {brandParts.map((part, i) => (
                                          <span key={i} className={part.highlight ? "bg-yellow-200 font-medium" : ""}>
                                            {part.text}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CommandItem>
                              )
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProduct && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                    {selectedProduct.stock < 10 && (
                      <p className="text-xs text-amber-600">Only {selectedProduct.stock} in stock</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-3 bg-muted/30 rounded-md">
                      <div>
                        <Label className="text-xs text-muted-foreground">Price</Label>
                        <div className="flex items-center">
                          <span className="mr-1">₹</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editablePrice}
                            onChange={(e) => setEditablePrice(e.target.value)}
                            className="h-8 py-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">UOM</Label>
                        <Input
                          type="text"
                          value={editableUOM}
                          onChange={(e) => setEditableUOM(e.target.value)}
                          placeholder="Unit"
                          className="h-8 py-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Stock</Label>
                        <p className="font-medium">{selectedProduct.stock}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Brand</Label>
                        <p className="font-medium">{selectedProduct.brand || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">HSN Code</Label>
                        <p className="font-medium">{selectedProduct.hsn_code || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">GST %</Label>
                        <p className="font-medium">{selectedProduct.gst_percentage || 0}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Button type="button" onClick={addProductToOrder} className="flex items-center gap-1">
                      <Plus className="h-4 w-4" /> {editingItemIndex !== null ? "Update Item" : "Add to Order"}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {loadingItems ? (
              <div className="text-center p-4">Loading order items...</div>
            ) : orderItems.length > 0 ? (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Order Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">MRP</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">UOM</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.article_text}</TableCell>
                          <TableCell className="text-right">₹{item.cost_price}</TableCell>
                          <TableCell className="text-right">₹{item.mrp}</TableCell>
                          <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-right">{item.uom || "-"}</TableCell>
                          <TableCell className="text-right">
                            ₹{(item.cost_price * item.ordered_quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeArticle(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-medium">
                          Grand Total (Including GST): {/* This value automatically updates the Total Payment Amount */}
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{subtotal.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {/* <TableRow>
                        <TableCell colSpan={5} className="text-right font-medium">
                          Grand Total:
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{grandTotal.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>*/}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">No products added to this order yet</div>
            )}
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Payment Details</h3>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <RadioGroup
                value={paymentTerms}
                onValueChange={(value) => setPaymentTerms(value as any)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-3 days" id="0-3" />
                  <Label htmlFor="0-3">0-3 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4-7 days" id="4-7" />
                  <Label htmlFor="4-7">4-7 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8-15 days" id="8-15" />
                  <Label htmlFor="8-15">8-15 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="16-30 days" id="16-30" />
                  <Label htmlFor="16-30">16-30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more than 30 days" id="more-than-30" />
                  <Label htmlFor="more-than-30">more than 30 days</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as any)}>
                  <SelectTrigger id="payment-status">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="net_banking">Net Banking</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="Bank Tranfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-due-date">Payment Due Date</Label>
                <Popover open={paymentDueDateOpen} onOpenChange={setPaymentDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="payment-due-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDueDate ? format(paymentDueDate, "PPP") : <span>Select due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDueDate}
                      onSelect={(date) => {
                        setPaymentDueDate(date)
                        setPaymentDueDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-scheduled-date">Payment Scheduled Date</Label>
                <Popover open={paymentScheduledDateOpen} onOpenChange={setPaymentScheduledDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="payment-scheduled-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentScheduledDate ? format(paymentScheduledDate, "PPP") : <span>Select scheduled date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentScheduledDate}
                      onSelect={(date) => {
                        setPaymentScheduledDate(date)
                        setPaymentScheduledDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., Transaction ID, Cheque Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partial-payment-amount">Partial Payment Amount (₹)</Label>
                <Input
                  id="partial-payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={partialPaymentAmount || ""}
                  onChange={(e) => handlePartialPaymentChange(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {partialPaymentAmount > 0 && (
                  <div className="mt-1 text-sm">
                    {partialPaymentAmount > grandTotal ? (
                      <p className="text-red-500">Partial payment exceeds total amount</p>
                    ) : (
                      <p>
                        Remaining amount: ₹<span className="font-medium">{remainingAmount.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-payment-amount">Total Payment Amount (₹)</Label>
                <Input
                  id="total-payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalPaymentAmount || ""}
                  onChange={(e) => setTotalPaymentAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  readOnly={partialPaymentAmount > 0}
                  className={partialPaymentAmount > 0 ? "bg-gray-100" : ""}
                />
                {partialPaymentAmount > totalPaymentAmount && totalPaymentAmount > 0 && (
                  <p className="text-xs text-red-500">Partial payment cannot exceed total payment amount</p>
                )}
                {partialPaymentAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total payment amount is set to the grand total when partial payment is entered
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Payment Notes</Label>
              <textarea
                id="payment-notes"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any additional payment notes here..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Return to Vendor (RTV)</Label>
            <RadioGroup value={rtv} onValueChange={(value) => setRtv(value as "Yes" | "No")} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="rtv-yes" />
                <Label htmlFor="rtv-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="rtv-no" />
                <Label htmlFor="rtv-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {purchaseOrder && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {["Created", "Approved", "Cancelled", "Completed", "Dispatched", "Delivered"].map((status) => (
                  <Badge
                    key={status}
                    variant={poStatus === status ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPoStatus(status as any)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {purchaseOrder && (
            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-medium">Vendor Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span> {purchaseOrder.vendor_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Code:</span> {purchaseOrder.vendor_code}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {purchaseOrder.vendor_phone}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span> {purchaseOrder.vendor_email}
                </div>
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Address:</span> {purchaseOrder.vendor_address}
                </div>
                <div>
                  <span className="text-muted-foreground">GST:</span> {purchaseOrder.vendor_gst}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setShowCancelDialog(true)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !vendorId || orderItems.length === 0}>
            {loading ? "Saving..." : purchaseOrder ? "Update Purchase Order" : "Create Purchase Order"}
          </Button>
        </CardFooter>
      </Card>
      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirmation}>
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
