"use client"

import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { subDays } from "date-fns"

export function DateRangePicker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setPresetRange = (days: number) => {
    const toDate = new Date()
    const fromDate = subDays(toDate, days)

    const params = new URLSearchParams(searchParams)
    params.set("from", fromDate.toISOString())
    params.set("to", toDate.toISOString())

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(7)}>
        Last 7 days
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(30)}>
        Last 30 days
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={() => setPresetRange(15)}>
        Last 15 days
      </Button>
    </div>
  )
}
