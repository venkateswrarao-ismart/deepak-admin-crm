"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Car,
  Truck,
  FileText,
  Users,
  Store,
  Layers,
  Receipt,
  ArrowLeftRight,
  BarChart,
  TrendingUp,
  ImageIcon,
  LogOut,
  Settings,
  BarChart3,
  Clock,
  ShoppingBag,
} from "lucide-react"
import {useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
   const [authData, setAuthData] = useState(null)


    useEffect(() => {
       // Safely access localStorage only on the client side
       try {
         const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
         if (authDataString) {
           const parsedAuthData = JSON.parse(authDataString)
           setAuthData(parsedAuthData)
         }
       } catch (error) {
         console.error("Error accessing localStorage:", error)
       }
     }, [])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const supabase = createClient()

      // Sign out with scope: 'global' to clear all sessions across devices
      const { error } = await supabase.auth.signOut({ scope: "global" })

      if (error) {
        console.error("Supabase signOut error:", error)
      }

      // Specifically target and remove Supabase auth tokens from localStorage
      Object.keys(localStorage).forEach((key) => {
        // Look for keys matching the Supabase auth token pattern (sb-*-auth-token)
        if (key.match(/^sb-.*-auth-token$/)) {
          console.log(`Removing Supabase auth token: ${key}`)
          localStorage.removeItem(key)
        }
      })

      // Clear session cookies by setting them to expire
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.trim().split("=")
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      })

      console.log("Sign-out successful, redirecting to login page")

      // Force a complete page reload to clear any in-memory state
      window.location.href = "/login"
    } catch (error) {
      console.error("Error during sign-out process:", error)
      // Even if there's an error, try to redirect to login
      window.location.href = "/login"
    } finally {
      setIsSigningOut(false)
    }
  }
       const allowedAdminIds = [
         "45d30bc9-3790-40d9-8010-b2cd9f5bb4eb",
         "00b89641-1870-4c9c-a110-b8f87a3c2d45" // Raaju user
        ]

        const isAdmin = allowedAdminIds.includes(authData?.user?.id)


  return (
    <nav className="hidden md:flex flex-col h-full bg-[#1E293B] border-r border-gray-700 overflow-y-auto py-6 w-64 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 print:hidden">
      {/* <div className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold">
            I
          </div>
          <span className="text-xl font-semibold">iSmart</span>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 px-4 pr-8 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <span className="text-xs font-medium">⌘K</span>
          </div>
        </div>
      </div>*/}

      <div className="flex flex-col space-y-1 px-3">
        <Link href="/dashboard" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname === "/dashboard" ? "bg-blue-900/50 text-blue-300 font-medium" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </div>
        </Link>

        <Link href="/dashboard/orders" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/orders")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            Orders
          </div>
        </Link>
       {isAdmin && (
         <Link href="/dashboard/bulkorder-print" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/bulkorder-print")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
           bulkorders-print
          </div>
        </Link>)}

        <Link href="/dashboard/order-analytics" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/order-analytics")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Order Analytics
          </div>
        </Link>

        <Link href="/dashboard/products" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/products")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Package className="h-5 w-5" />
            Articles(Products)
          </div>
        </Link>

        {/* <Link href="/dashboard/articles" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/articles")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Layers className="h-5 w-5" />
            Articles
          </div>
        </Link>*/}

        <Link href="/dashboard/categories" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/categories")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Layers className="h-5 w-5" />
            Categories
          </div>
        </Link>

        <Link href="/dashboard/vendors" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/vendors")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Store className="h-5 w-5" />
            Vendors
          </div>
        </Link>

        <Link href="/dashboard/shop-owners" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/shop-owners")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Users className="h-5 w-5" />
            Shop Owners
          </div>
        </Link>

        <Link href="/dashboard/customers" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/customers")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Users className="h-5 w-5" />
            Customers
          </div>
        </Link>




        <Link href="/dashboard/unplaced" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/unplaced")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Package className="h-5 w-5" />
            Unplaced Orders
          </div>
        </Link>

        <Link href="/dashboard/coupons" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/coupons")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Package className="h-5 w-5" />
            Coupons
          </div>
        </Link>

        <Link href="/dashboard/sales_asm" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/sales_asm")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Package className="h-5 w-5" />
            Sales ASM
          </div>
        </Link>

        <Link href="/dashboard/sales-executive" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/sales-executive")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Package className="h-5 w-5" />
            Sales Executive
          </div>
        </Link>

        <Link href="/dashboard/purchase-orders" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/purchase-orders")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <FileText className="h-5 w-5" />
            Purchase Orders
          </div>
        </Link>

        <Link href="/dashboard/inbound" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/inbound")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Truck className="h-5 w-5" />
            Inbound
          </div>
        </Link>

        <Link href="/dashboard/grn" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/grn")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Receipt className="h-5 w-5" />
            GRN
          </div>
        </Link>

        <Link href="/dashboard/reverse-grn" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/reverse-grn")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <ArrowLeftRight className="h-5 w-5" />
            Reverse GRN
          </div>
        </Link>

        <Link href="/dashboard/inventory-reports" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/inventory-reports")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <BarChart className="h-5 w-5" />
            Inventory Reports
          </div>
        </Link>

        <Link href="/dashboard/fast-moving-products" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/fast-moving-products")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            Fast-Moving Products
          </div>
        </Link>

        <Link href="/dashboard/aging-stock" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/aging-stock")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Clock className="h-5 w-5" />
            Aging Stock
          </div>
        </Link>

 <Link href="/dashboard/payment-transactions" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/payment-transactions")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Receipt className="h-5 w-5" />
            Payment Transactions
          </div>
        </Link>



        <Link href="/dashboard/discount-banners" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/discount-banners")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <ImageIcon className="h-5 w-5" />
            Discount Banners
          </div>
        </Link>

        <Link href="/dashboard/banners" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/banners")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <ImageIcon className="h-5 w-5" />
            Banners
          </div>
        </Link>

        <Link href="/dashboard/drivers" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/drivers")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Car className="h-5 w-5" />
            Drivers
          </div>
        </Link>

        <Link href="/dashboard/store-settings" className="w-full">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              pathname?.includes("/dashboard/store-settings")
                ? "bg-blue-900/50 text-blue-300 font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Settings className="h-5 w-5" />
            Store Settings
          </div>
        </Link>
      </div>

      <div className="mt-auto pt-4 px-3 border-t border-gray-700 mx-3">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-gray-300 hover:bg-gray-800"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-5 w-5" />
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
      <style jsx>{`
  nav::-webkit-scrollbar {
    width: 6px;
  }
  
  nav::-webkit-scrollbar-track {
    background: transparent;
  }
  
  nav::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  
  nav::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }
`}</style>
    </nav>
  )
}
