import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { Toaster as HotToaster } from "react-hot-toast"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Admin dashboard for inventory management",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          {/* Keep the original Toaster */}
          <ShadcnToaster />
          {/* Add react-hot-toast as an alternative */}
          <HotToaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                style: {
                  background: "green",
                },
              },
              error: {
                style: {
                  background: "red",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
