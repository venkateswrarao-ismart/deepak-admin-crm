import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import Link from "next/link"

export default function StoreSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Store Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/store-settings/minimum-order">
          <Card className="h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Minimum Order Settings</CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Configure minimum order value requirements for customers</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/store-settings/cash-on-delivery">
          <Card className="h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Cash on Delivery</CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Enable or disable cash on delivery payment option</CardDescription>
            </CardContent>
          </Card>
        </Link>
        {/* Additional store settings cards can be added here in the future */}
      </div>
    </div>
  )
}
