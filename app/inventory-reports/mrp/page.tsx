"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, RefreshCw, Save, Edit, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"

export default function MRPUpdatePage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [newMrpValue, setNewMrpValue] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Mock data for demonstration
  const mrpData = [
    {
      mrp_id: 1,
      article_id: "10001234",
      article_name: "Premium Cotton T-Shirt",
      mrp_value: 599.0,
      oldmrp_value: 549.0,
      effective_date: "2023-05-15",
      updated_by: "Admin User",
      updated_at: "2023-05-10T10:30:00Z",
    },
    {
      mrp_id: 2,
      article_id: "10001235",
      article_name: "Slim Fit Jeans",
      mrp_value: 1299.0,
      oldmrp_value: 1199.0,
      effective_date: "2023-05-20",
      updated_by: "Admin User",
      updated_at: "2023-05-12T14:45:00Z",
    },
    {
      mrp_id: 3,
      article_id: "10001236",
      article_name: "Leather Belt",
      mrp_value: 799.0,
      oldmrp_value: 799.0,
      effective_date: "2023-05-10",
      updated_by: "Admin User",
      updated_at: "2023-05-05T09:15:00Z",
    },
    {
      mrp_id: 4,
      article_id: "10001237",
      article_name: "Wool Sweater",
      mrp_value: 1499.0,
      oldmrp_value: 1299.0,
      effective_date: "2023-05-25",
      updated_by: "Admin User",
      updated_at: "2023-05-15T11:20:00Z",
    },
    {
      mrp_id: 5,
      article_id: "10001238",
      article_name: "Running Shoes",
      mrp_value: 2499.0,
      oldmrp_value: 2299.0,
      effective_date: "2023-06-01",
      updated_by: "Admin User",
      updated_at: "2023-05-20T16:10:00Z",
    },
  ]

  const handleUpdateMRP = () => {
    if (!selectedArticle || !newMrpValue) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setIsDialogOpen(false)
      alert(`MRP for ${selectedArticle.article_name} updated successfully!`)
    }, 1000)
  }

  const openUpdateDialog = (article: any) => {
    setSelectedArticle(article)
    setNewMrpValue(article.mrp_value.toString())
    setIsDialogOpen(true)
  }

  const getMrpChangeStatus = (current: number, old: number) => {
    if (current > old) return { label: "Increased", color: "warning" }
    if (current < old) return { label: "Decreased", color: "destructive" }
    return { label: "Unchanged", color: "secondary" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MRP Updates</h2>
          <p className="text-muted-foreground">Manage and track changes to Maximum Retail Price</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current MRP</TabsTrigger>
          <TabsTrigger value="history">Update History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current MRP Values</CardTitle>
              <CardDescription>View and update Maximum Retail Price for all articles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    className="pl-8 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article ID</TableHead>
                        <TableHead>Article Name</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Current MRP
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead>Previous MRP</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mrpData.map((item) => {
                        const status = getMrpChangeStatus(item.mrp_value, item.oldmrp_value)
                        return (
                          <TableRow key={item.mrp_id}>
                            <TableCell className="font-medium">{item.article_id}</TableCell>
                            <TableCell>{item.article_name}</TableCell>
                            <TableCell>₹{item.mrp_value.toFixed(2)}</TableCell>
                            <TableCell>₹{item.oldmrp_value.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={status.color as any}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>{item.effective_date}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openUpdateDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MRP Update History</CardTitle>
              <CardDescription>Track all changes made to MRP values over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search articles..." className="pl-8 max-w-sm" />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article ID</TableHead>
                        <TableHead>Article Name</TableHead>
                        <TableHead>New MRP</TableHead>
                        <TableHead>Old MRP</TableHead>
                        <TableHead>Updated By</TableHead>
                        <TableHead>Updated At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mrpData.map((item) => (
                        <TableRow key={item.mrp_id}>
                          <TableCell className="font-medium">{item.article_id}</TableCell>
                          <TableCell>{item.article_name}</TableCell>
                          <TableCell>₹{item.mrp_value.toFixed(2)}</TableCell>
                          <TableCell>₹{item.oldmrp_value.toFixed(2)}</TableCell>
                          <TableCell>{item.updated_by}</TableCell>
                          <TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update MRP</DialogTitle>
            <DialogDescription>Update the Maximum Retail Price for {selectedArticle?.article_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="article-id" className="text-right">
                Article ID
              </Label>
              <Input id="article-id" value={selectedArticle?.article_id || ""} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-mrp" className="text-right">
                Current MRP
              </Label>
              <Input
                id="current-mrp"
                value={selectedArticle ? `₹${selectedArticle.mrp_value.toFixed(2)}` : ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-mrp" className="text-right">
                New MRP
              </Label>
              <Input
                id="new-mrp"
                value={newMrpValue}
                onChange={(e) => setNewMrpValue(e.target.value)}
                className="col-span-3"
                type="number"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="effective-date" className="text-right">
                Effective Date
              </Label>
              <Input
                id="effective-date"
                type="date"
                defaultValue={format(new Date(), "yyyy-MM-dd")}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMRP} disabled={loading} className="gap-2">
              {loading ? (
                "Updating..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
