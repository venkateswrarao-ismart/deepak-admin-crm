import { createClient } from "@/utils/supabase/server"
import { PaymentTransactionsClient } from "./payment-transactions-client"

export default async function PaymentTransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()

  const search = searchParams.search as string
  const status = searchParams.status as string
  const type = searchParams.type as string

  let query = supabase
    .from("payment_transactions")
    .select(`
    *,
    vendors (
      name,
      contact_number,
      email,
      vendor_code
    )
  `)
    .order("payment_date", { ascending: false })

  if (search) {
    query = query.or(`id.ilike.%${search}%,reference_number.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (type && type !== "all") {
    query = query.eq("transaction_type", type)
  }

  const { data: transactions, error } = await query

  if (error) {
    console.error("Error fetching payment transactions:", error)
    return <div>Error loading payment transactions</div>
  }

  return <PaymentTransactionsClient transactions={transactions || []} searchParams={{ search, status, type }} />
}
