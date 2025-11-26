import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function InventoryReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <DashboardNav />
        <div className="flex-1">
          <div className="flex h-14 items-center border-b px-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Inventory Reports</h1>
          </div>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
