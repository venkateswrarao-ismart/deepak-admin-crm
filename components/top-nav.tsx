"use client"

import { useState, useEffect } from "react"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsPopover } from "@/components/notifications"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export function TopNav() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (raw) {
        const parsed = JSON.parse(raw)
        const email = parsed?.user?.email ?? parsed?.user_metadata?.email
        setUserEmail(email || "Unknown User")
      }
    } catch (error) {
      console.error("Failed to parse auth token:", error)
    }
  }, [])

  const handleToggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar-container")
    sidebar?.classList.toggle("sidebar-open")
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.removeItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      setTimeout(() => {
        window.location.href = "/login"
      }, 500)
    } catch (error) {
      console.error("Error signing out:", error)
      setTimeout(() => {
        window.location.href = "/login"
      }, 500)
    }
  }

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full">
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/orders" className="w-full">
                Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/products" className="w-full">
                Articles (Products)
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/categories" className="w-full">
                Categories
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/vendors" className="w-full">
                Vendors
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/shop-owners" className="w-full">
                Shop Owners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/customers" className="w-full">
                Customers
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/unplaced" className="w-full">
                Unplaced Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/coupons" className="w-full">
                Coupons
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
       
         <div className="flex items-center gap-2">
          <Link href="/dashboard">
          <Image src="/ismart2-logo.png" alt="iSmart Logo" width={40} height={40} className="h-8 w-auto" />
          <span className="hidden font-bold md:inline-block">iSmart Admin</span>
           </Link>
         </div>
       
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-sm text-muted-foreground">
            Logged in as <span className="font-semibold">{userEmail}</span>
          </span>
        )}
        <NotificationsPopover />
      </div>
    </div>
  )
}
;<style jsx global>{`
  @media (max-width: 768px) {
    .sidebar-container {
      display: none;
    }
  }
`}</style>
