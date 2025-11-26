import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "lucide-react"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

// Fetch low stock items from the database
async function getLowStockItems() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch products data
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("article_id, name, stock, category, price, mrp, cost_price")

  if (productsError) {
    console.error("Error fetching products:", productsError)
    return []
  }

  // Filter for low stock items
  // Assuming reorder level is 20% of current stock for this example
  const lowStockItems = products
    .map((product) => {
      const reorderLevel = Math.round(product.stock * 0.2) || 10
      let status = "In Stock"

      if (product.stock <= reorderLevel * 0.5) {
        status = "Critical"
      } else if (product.stock <= reorderLevel) {
        status = "Low"
      }

      return {
        id: product.article_id,
        name: product.name,
        currentQty: product.stock,
        reorderLevel,
        status,
      }
    })
    .filter((item) => item.status === "Low" || item.status === "Critical")
    .sort((a, b) => {
      // Sort by status (Critical first) then by stock level (lowest first)
      if (a.status === "Critical" && b.status !== "Critical") return -1
      if (a.status !== "Critical" && b.status === "Critical") return 1
      return a.currentQty - b.currentQty
    })
    .slice(0, 5) // Limit to 5 items for the dashboard

  return lowStockItems
}

export default async function InventoryReportsPage() {
  // Fetch low stock items
  const lowStockItems = await getLowStockItems()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/inventory-reports/soh">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock on Hand</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">SOH Report</div>
              <p className="text-xs text-muted-foreground">View current inventory levels and stock status</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/inventory-reports/map-dump">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MAP Dump Files</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Data Export</div>
              <p className="text-xs text-muted-foreground">Generate and download inventory data dumps</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/inventory-reports/mrp">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRP Updates</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Inventory Planning</div>
              <p className="text-xs text-muted-foreground">Manage reorder levels and inventory planning</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/inventory-reports/cycle-counts">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cycle Counts</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 8h7" />
                  <path d="M8 12h6" />
                  <path d="M11 16h4" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Schedule Counts</div>
              <p className="text-xs text-muted-foreground">Plan and manage inventory cycle counts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/inventory-reports/variance">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variance Reports</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Discrepancy Analysis</div>
              <p className="text-xs text-muted-foreground">Track and manage inventory variances</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="low-stock" className="mt-4">
        <TabsList>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="recent-variances">Recent Variances</TabsTrigger>
          <TabsTrigger value="upcoming-counts">Upcoming Counts</TabsTrigger>
        </TabsList>
        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that are below or approaching their reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Article ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Current Qty</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Reorder Level</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle">{item.id}</td>
                          <td className="p-4 align-middle">{item.name}</td>
                          <td className="p-4 align-middle">{item.currentQty}</td>
                          <td className="p-4 align-middle">{item.reorderLevel}</td>
                          <td className="p-4 align-middle">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                item.status === "Critical"
                                  ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                  : "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td colSpan={5} className="p-4 align-middle text-center">
                          No low stock items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent-variances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Variances</CardTitle>
              <CardDescription>Recent inventory discrepancies that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Article ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">System Qty</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Physical Qty</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Variance</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">10005</td>
                      <td className="p-4 align-middle">Product E</td>
                      <td className="p-4 align-middle">50</td>
                      <td className="p-4 align-middle">45</td>
                      <td className="p-4 align-middle">
                        <span className="text-red-600">-5</span>
                      </td>
                      <td className="p-4 align-middle">2023-04-05</td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">10012</td>
                      <td className="p-4 align-middle">Product F</td>
                      <td className="p-4 align-middle">25</td>
                      <td className="p-4 align-middle">28</td>
                      <td className="p-4 align-middle">
                        <span className="text-green-600">+3</span>
                      </td>
                      <td className="p-4 align-middle">2023-04-04</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upcoming-counts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Cycle Counts</CardTitle>
              <CardDescription>Scheduled inventory counts for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Count ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Warehouse</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Start Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Items</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">CC-001</td>
                      <td className="p-4 align-middle">Main Warehouse</td>
                      <td className="p-4 align-middle">2023-04-10</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Planned
                        </span>
                      </td>
                      <td className="p-4 align-middle">25</td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">CC-002</td>
                      <td className="p-4 align-middle">East Warehouse</td>
                      <td className="p-4 align-middle">2023-04-12</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Planned
                        </span>
                      </td>
                      <td className="p-4 align-middle">18</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
