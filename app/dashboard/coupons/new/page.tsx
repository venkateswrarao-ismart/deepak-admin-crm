"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.coerce.number().gt(0),
  minimum_order_amount: z.coerce.number().min(0).optional(),
  maximum_discount_amount: z.coerce.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_uses: z.coerce.number().min(1).optional(),
  is_active: z.boolean().default(true),
  unlimited: z.boolean().default(false),
  onboard_show: z.boolean().default(false), // ✅ new field
})

export default function NewCouponPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      is_active: true,
      unlimited: false,
      onboard_show: false, // ✅ new field default
    },
  })

  const unlimited = watch("unlimited")

  const onSubmit = async (values: any) => {
    setLoading(true)

    const payload = {
      ...values,
      max_uses: values.unlimited ? null : values.max_uses,
      start_date: values.start_date || new Date().toISOString(),
      end_date: values.end_date || null,
    }

    const { error } = await supabase.from("coupons").insert([
      {
        id: uuidv4(),
        ...payload,
      },
    ])
    setLoading(false)

    if (error) {
      console.error("Error creating coupon:", error)
      alert("Failed to create coupon")
    } else {
      router.push("/dashboard/coupons")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Coupon</CardTitle>
          <CardDescription>
            Fill in the details to create a new discount coupon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Coupon Code *</Label>
              <Input {...register("code")} placeholder="SAVE20" />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <Controller
                  name="discount_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("discount_value", { valueAsNumber: true })}
                />
                {errors.discount_value && (
                  <p className="text-sm text-red-500">{errors.discount_value.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Minimum Order Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("minimum_order_amount", { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label>Maximum Discount Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("maximum_discount_amount", { valueAsNumber: true })}
                />
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
                <Input
                  type="number"
                  {...register("max_uses", { valueAsNumber: true })}
                />
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
                      if (checked) setValue("max_uses", undefined)
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
              {loading ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
