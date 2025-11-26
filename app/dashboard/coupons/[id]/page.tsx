"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

const formSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Enter a valid positive number",
    }),
  minimum_order_amount: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === "" || !isNaN(Number(val)), {
      message: "Enter a valid number",
    }),
  maximum_discount_amount: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === "" || !isNaN(Number(val)), {
      message: "Enter a valid number",
    }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_uses: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === "" || Number(val) >= 1, {
      message: "Enter a number >= 1",
    }),
  is_active: z.boolean().default(true),
  unlimited: z.boolean().default(false),
  onboard_show: z.boolean().default(false), // ✅ New field added
})

type FormValues = z.infer<typeof formSchema>

export default function UpsertCouponPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unlimited: false,
      onboard_show: false, // ✅ Default value for onboard_show
    },
  })

  const unlimited = watch("unlimited")
  const isEditMode = Boolean(id)

  useEffect(() => {
    async function fetchCoupon() {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Failed to fetch coupon:", error)
        return
      }

      reset({
        ...data,
        discount_type: data.discount_type || "percentage",
        discount_value: String(data.discount_value ?? ""),
        minimum_order_amount: data.minimum_order_amount
          ? String(data.minimum_order_amount)
          : "",
        maximum_discount_amount: data.maximum_discount_amount
          ? String(data.maximum_discount_amount)
          : "",
        max_uses: data.max_uses ? String(data.max_uses) : "",
        unlimited: data.max_uses === null,
        start_date: data.start_date
          ? format(new Date(data.start_date), "yyyy-MM-dd'T'HH:mm")
          : undefined,
        end_date: data.end_date
          ? format(new Date(data.end_date), "yyyy-MM-dd'T'HH:mm")
          : undefined,
        is_active: data.is_active ?? true,
        onboard_show: data.onboard_show ?? false, // ✅ Populate onboard_show
      })
    }

    if (isEditMode) {
      fetchCoupon()
    }
  }, [id, reset, supabase, isEditMode])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)

    const payload = {
      ...values,
      discount_value: Number(values.discount_value),
      minimum_order_amount: values.minimum_order_amount
        ? Number(values.minimum_order_amount)
        : null,
      maximum_discount_amount: values.maximum_discount_amount
        ? Number(values.maximum_discount_amount)
        : null,
      max_uses: values.unlimited ? null : Number(values.max_uses),
      end_date: values.end_date || null,
    }

    let error
    if (isEditMode) {
      const res = await supabase.from("coupons").update(payload).eq("id", id)
      error = res.error
    } else {
      const res = await supabase.from("coupons").insert(payload)
      error = res.error
    }

    setLoading(false)

    if (error) {
      console.error("Error saving coupon:", error)
      alert("Failed to save coupon")
    } else {
      router.push("/dashboard/coupons")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Coupon" : "Create Coupon"}</CardTitle>
          <CardDescription>
            {isEditMode ? "Update coupon details" : "Add a new coupon"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input {...register("code")} placeholder="SAVE20" />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea {...register("description")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <select
                  {...register("discount_type")}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <Label>Discount Value</Label>
                <Input type="text" {...register("discount_value")} />
                {errors.discount_value && (
                  <p className="text-sm text-red-500">
                    {errors.discount_value.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Minimum Order Amount</Label>
                <Input type="text" {...register("minimum_order_amount")} />
                {errors.minimum_order_amount && (
                  <p className="text-sm text-red-500">
                    {errors.minimum_order_amount.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Maximum Discount Amount</Label>
                <Input type="text" {...register("maximum_discount_amount")} />
                {errors.maximum_discount_amount && (
                  <p className="text-sm text-red-500">
                    {errors.maximum_discount_amount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" {...register("start_date")} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" {...register("end_date")} />
              </div>
            </div>

            {!unlimited && (
              <div>
                <Label>Maximum Uses</Label>
                <Input type="text" {...register("max_uses")} />
                {errors.max_uses && (
                  <p className="text-sm text-red-500">
                    {errors.max_uses.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Controller
                name="unlimited"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="unlimited"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (checked) reset((prev) => ({ ...prev, max_uses: "" }))
                    }}
                  />
                )}
              />
              <Label htmlFor="unlimited">Unlimited Uses</Label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="onboard_show"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="onboard_show"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="onboard_show">Show on Onboarding</Label>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Coupon" : "Create Coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
