export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}
