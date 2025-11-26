import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ReverseGRNForm } from "../_components/reverse-grn-form"

export const metadata: Metadata = {
  title: "Create Return | Inventory Management",
  description: "Create a new return for received goods",
}

export default function NewReverseGRNPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/reverse-grn">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Return</h1>
          <p className="text-muted-foreground">Process a return for previously received goods</p>
        </div>
      </div>

      <ReverseGRNForm />
    </div>
  )
}
