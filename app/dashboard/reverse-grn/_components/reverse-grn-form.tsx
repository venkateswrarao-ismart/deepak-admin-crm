"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our data
type GRN = {
  id: string
  po_id: string | null
  received_date: string | null
  status: string | null
  vendor_name: string | null
}

type GRNItem = {
  id: string
  grn_id: string
  article_id: string
  product_name: string | null
  received_quantity: number
  unit_price: number | null
  returnQuantity: number
}

const formSchema = z.object({
  grnId: z.string().min(1, { message: "Please select a GRN" }),
  returnDate: z.date(),
  reason: z.string().min(1, { message: "Please provide a return reason" }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      grn_id: z.string(),
      article_id: z.string(),
      product_name: z.string().nullable(),
      received_quantity: z.number(),
      returnQuantity: z.number().min(0),
      unit_price: z.number().nullable(),
    }),
  ),
})

type FormValues = z.infer<typeof formSchema>

export function ReverseGRNForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [grns, setGrns] = useState<GRN[]>([])
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      returnDate: new Date(),
      reason: "",
      notes: "",
      items: [],
    },
  })

  // Fetch GRNs on component mount
  useEffect(() => {
    async function fetchGRNs() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("goods_receipt_notes")
          .select(`
            id,
            po_id,
            received_date,
            status,
            purchase_orders(vendor_name)
          `)
          .eq("status", "Received")
          .order("received_date", { ascending: false })

        if (error) {
          console.error("Error fetching GRNs:", error)
          setError("Failed to load GRNs. Please try again.")
          return
        }

        // Transform the data
        const formattedGRNs = data.map((grn) => ({
          id: grn.id,
          po_id: grn.po_id,
          received_date: grn.received_date,
          status: grn.status,
          vendor_name: grn.purchase_orders?.vendor_name || "Unknown Vendor",
        }))

        setGrns(formattedGRNs)
      } catch (err) {
        console.error("Error in fetchGRNs:", err)
        setError("Failed to load GRNs. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchGRNs()
  }, [supabase])

  // Fetch GRN items when a GRN is selected
  const handleGRNChange = async (grnId: string) => {
    setLoadingItems(true)
    setError(null)

    try {
      const selectedGRN = grns.find((g) => g.id === grnId)
      setSelectedGRN(selectedGRN || null)
      form.setValue("grnId", grnId)

      // Fetch GRN items with better error handling and logging
      console.log("Fetching items for GRN:", grnId)

      // First, get all grn_items for this GRN
      const { data: grnItemsData, error: grnItemsError } = await supabase
        .from("grn_itemstwo")
        .select(`
          id,
          grn_id,
          article_id,
          received_quantity,
          unit_price
        `)
        .eq("grn_id", grnId)

      if (grnItemsError) {
        console.error("Error fetching GRN items:", grnItemsError)
        setError("Failed to load GRN items. Please try again.")
        return
      }

      console.log("GRN items fetched:", grnItemsData)

      // Filter items with received_quantity > 0
      const validItems = grnItemsData.filter((item) => item.received_quantity > 0)

      if (validItems.length === 0) {
        console.log("No items with received_quantity > 0 found")
        form.setValue("items", [])
        return
      }

      // Get product names for each item
      const formattedItems = await Promise.all(
        validItems.map(async (item) => {
          // Get product name from products table using article_id
          let productName = `Article ID: ${item.article_id}`

          if (item.article_id) {
            const { data: productData, error: productError } = await supabase
              .from("products")
              .select("name")
              .eq("article_id", item.article_id)
              .maybeSingle()

            if (!productError && productData) {
              productName = productData.name
            }
          }

          return {
            id: item.id,
            grn_id: item.grn_id,
            article_id: item.article_id || "",
            product_name: productName,
            received_quantity: item.received_quantity || 0,
            unit_price: item.unit_price || 0,
            returnQuantity: 0,
          }
        }),
      )

      console.log("Formatted items with product names:", formattedItems)
      form.setValue("items", formattedItems)
    } catch (err) {
      console.error("Error in handleGRNChange:", err)
      setError("Failed to load GRN items. Please try again.")
    } finally {
      setLoadingItems(false)
    }
  }

  const handleQuantityChange = (index: number, value: number) => {
    const items = form.getValues("items")
    const item = items[index]

    // Ensure return quantity doesn't exceed received quantity
    const validValue = Math.min(value, item.received_quantity)

    const updatedItems = [...items]
    updatedItems[index] = {
      ...item,
      returnQuantity: validValue,
    }

    form.setValue("items", updatedItems)
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true)
      setError(null)

      // Filter out items with zero return quantity
      const itemsToReturn = data.items.filter((item) => item.returnQuantity > 0)

      if (itemsToReturn.length === 0) {
        setError("Please specify at least one item to return")
        setSubmitting(false)
        return
      }

      // Insert into reverse_grn table
      const { data: reverseGRN, error: reverseGRNError } = await supabase
        .from("reverse_grn")
        .insert({
          grn_id: data.grnId,
          return_date: data.returnDate.toISOString(),
          reason: data.reason,
          notes: data.notes || null,
          status: "Pending",
        })
        .select("id")
        .single()

      if (reverseGRNError) {
        console.error("Error creating reverse GRN:", reverseGRNError)
        setError("Failed to create return. Please try again.")
        return
      }

      // Insert items into reverse_grn_items table
      const reverseGRNItems = itemsToReturn.map((item) => ({
        reverse_grn_id: reverseGRN.id,
        grn_item_id: item.id,
        article_id: item.article_id,
        returned_quantity: item.returnQuantity,
        unit_price: item.unit_price || 0,
        reason: data.reason,
      }))

      const { error: itemsError } = await supabase.from("reverse_grn_items").insert(reverseGRNItems)

      if (itemsError) {
        console.error("Error creating reverse GRN items:", itemsError)
        setError("Failed to create return items. Please try again.")
        return
      }

      // Redirect to the reverse GRN list page
      router.push("/dashboard/reverse-grn")
      router.refresh()
    } catch (err) {
      console.error("Error creating return:", err)
      setError("Failed to create return. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const totalReturnValue = form
    .watch("items")
    .reduce((sum, item) => sum + item.returnQuantity * (item.unit_price || 0), 0)

  const totalReturnItems = form.watch("items").reduce((sum, item) => sum + (item.returnQuantity > 0 ? 1 : 0), 0)

  const totalReturnQuantity = form.watch("items").reduce((sum, item) => sum + item.returnQuantity, 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="grnId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select GRN</FormLabel>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select onValueChange={handleGRNChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a GRN" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grns.map((grn) => (
                        <SelectItem key={grn.id} value={grn.id}>
                          {grn.id} - {grn.vendor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormDescription>Select the GRN for which you want to process a return</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="returnDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Return Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The date when the return is being processed</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Reason</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged">Damaged Goods</SelectItem>
                    <SelectItem value="Defective">Defective Products</SelectItem>
                    <SelectItem value="Wrong">Wrong Items Received</SelectItem>
                    <SelectItem value="Excess">Excess Quantity</SelectItem>
                    <SelectItem value="Quality">Quality Issues</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Specify the reason for returning these items</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional details about this return"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about the condition of items or special handling instructions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedGRN && (
          <Card>
            <CardHeader>
              <CardTitle>Return Items</CardTitle>
              <CardDescription>Specify the quantities to return for each item</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : form.watch("items").length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No returnable items found for this GRN. Please select a different GRN or check if all items have zero
                  received quantity.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Received Qty</TableHead>
                      <TableHead>Return Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.watch("items").map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.received_quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={item.received_quantity}
                            value={item.returnQuantity}
                            onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>₹{(item.unit_price || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(item.returnQuantity * (item.unit_price || 0)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Items: {totalReturnItems} (Qty: {totalReturnQuantity})
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">Total Value: ₹{totalReturnValue.toLocaleString()}</p>
              </div>
            </CardFooter>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/reverse-grn")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loadingItems}>
            {submitting ? "Processing..." : "Create Return"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
