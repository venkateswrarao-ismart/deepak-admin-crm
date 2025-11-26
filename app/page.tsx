import { redirect } from "next/navigation"

export default function Home() {
  // Simple redirect to dashboard
  // Authentication will be handled by middleware
  redirect("/login")
}