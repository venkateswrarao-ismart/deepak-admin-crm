import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { TopNav } from "@/components/top-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />

      <div className="flex flex-col relative md:flex-row flex-1">
        <div className="sidebar-container fixed md:w-64 h-[calc(100vh-4rem)] z-20 bg-gray-100 dark:bg-gray-800 md:sticky md:top-16">
          <DashboardNav />
        </div>

        <main className="flex-1 py-6 px-3 sm:px-4 md:py-8 md:px-5 lg:px-8 overflow-auto max-w-full bg-[#f6f7f9] scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}