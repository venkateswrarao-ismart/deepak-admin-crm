"use client"

import { Suspense } from "react"
import PurchaseOrdersContent from "./purchase-orders-content"
import PurchaseOrdersLoading from "./loading"

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<PurchaseOrdersLoading />}>
      <PurchaseOrdersContent />
    </Suspense>
  )
}
