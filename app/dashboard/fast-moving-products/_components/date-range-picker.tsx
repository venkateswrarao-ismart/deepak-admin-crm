"use client"

import { useState, useEffect } from "react"
import { isValid, parseISO, subDays } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from date from URL params or default to 30 days ago
  const [fromDate, setFromDate] = useState<Date | undefined>(() => {
    try {
      const fromParam = searchParams.get("from")
      if (fromParam) {
        const date = parseISO(fromParam)
        if (isValid(date)) {
          return date
        }
      }
      // Default to 30 days ago
      return subDays(new Date(), 30)
    } catch (error) {
      console.error("Error parsing from date:", error)
      return subDays(new Date(), 30)
    }
  })

  // Initialize to date from URL params or default to today
  const [toDate, setToDate] = useState<Date | undefined>(() => {
    try {
      const toParam = searchParams.get("to")
      if (toParam) {
        const date = parseISO(toParam)
        if (isValid(date)) {
          return date
        }
      }
      // Default to today
      return new Date()
    } catch (error) {
      console.error("Error parsing to date:", error)
      return new Date()
    }
  })

  // Update URL when dates change
  useEffect(() => {
    if (fromDate && toDate && isValid(fromDate) && isValid(toDate)) {
      try {
        const params = new URLSearchParams(searchParams.toString())
        params.set("from", fromDate.toISOString())
        params.set("to", toDate.toISOString())

        router.replace(`/dashboard/fast-moving-products?${params.toString()}`, {
          scroll: false,
        })
      } catch (error) {
        console.error("Error updating URL:", error)
      }
    }
  }, [fromDate, toDate, router, searchParams])

  // Handle from date change
  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      setFromDate(date)
      // If to date is before from date, update to date
      if (toDate && date > toDate) {
        setToDate(date)
      }
    }
  }

  // Handle to date change
  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      setToDate(date)
      // If from date is after to date, update from date
      if (fromDate && date < fromDate) {
        setFromDate(date)
      }
    }
  }

  // Set preset date range
  const setPresetRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setFromDate(start)
    setToDate(end)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(7)}>
          Last 7 days
        </Button>

        <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(15)}>
          Last 15 days
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(30)}>
          Last 30 days
        </Button>
        
      </div>
    </div>
  )
}
