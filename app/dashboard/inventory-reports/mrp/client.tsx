"use client"

import { useState } from "react"
import { AlertCircle, ArrowUpDown, Edit, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MrpItem = {
  id: string
  name: string
  currentStock: number
  reorderLevel: number
  suggestedReorderLevel: number
  averageDemand: string
  leadTime: string
  status: string
  lastUpdated: string
}

interface MRPClientProps {
  initialMrpItems: MrpItem[]
}

export function MRPClient({ initialMrpItems }: MRPClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<MrpItem | null>(null)
  const [newReorderLevel, setNewReorderLevel] = useState("")
  const [mrpItems, setMrpItems] = useState<MrpItem[]>(initialMrpItems)

  const filteredItems = mrpItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const updateReorderLevel = () => {
    if (editingItem && newReorderLevel) {
      const updatedItems = mrpItems.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            reorderLevel: Number.parseInt(newReorderLevel),
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        }
        return item
      })
      setMrpItems(updatedItems)
      setEditingItem(null)
      setNewReorderLevel("")
    }
  }

  const applyAllSuggestions = () => {
    const updatedItems = mrpItems.map((item) => ({
      ...item,
      reorderLevel: item.suggestedReorderLevel,
      lastUpdated: new Date().toISOString().split("T")[0],
    }))
    setMrpItems(updatedItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by article ID or name..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={applyAllSuggestions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Apply All Suggestions
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>MRP Update</AlertTitle>
        <AlertDescription>
          The system has analyzed your inventory data and suggested optimal reorder levels based on demand patterns and
          lead times.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="overstocked">Overstocked</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Material Requirements Planning</CardTitle>
              <CardDescription>Review and update reorder levels for inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Reorder Level
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Suggested Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    {/*<TableHead className="text-right">Actions</TableHead>*/}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {item.suggestedReorderLevel}
                            {item.suggestedReorderLevel !== item.reorderLevel && (
                              <span
                                className={`ml-2 text-xs ${item.suggestedReorderLevel > item.reorderLevel ? "text-green-500" : "text-red-500"}`}
                              >
                                {item.suggestedReorderLevel > item.reorderLevel ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              item.status === "Normal"
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                : item.status === "Low Stock"
                                  ? "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                                  : item.status === "Critical"
                                    ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                    : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell>{item.lastUpdated}</TableCell>
                       {/* <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Update Reorder Level</DialogTitle>
                                <DialogDescription>Adjust the reorder level for {editingItem?.name}</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="current" className="text-right">
                                    Current
                                  </Label>
                                  <Input
                                    id="current"
                                    value={editingItem?.reorderLevel}
                                    className="col-span-3"
                                    disabled
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="suggested" className="text-right">
                                    Suggested
                                  </Label>
                                  <Input
                                    id="suggested"
                                    value={editingItem?.suggestedReorderLevel}
                                    className="col-span-3"
                                    disabled
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="new" className="text-right">
                                    New Level
                                  </Label>
                                  <Input
                                    id="new"
                                    value={newReorderLevel}
                                    onChange={(e) => setNewReorderLevel(e.target.value)}
                                    className="col-span-3"
                                    type="number"
                                    min="0"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={updateReorderLevel}>Save Changes</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>*/}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No items found. Try adjusting your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle>Critical Items</CardTitle>
              <CardDescription>Items with critically low stock levels that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Suggested Level</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems
                    .filter((item) => item.status === "Critical")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.suggestedReorderLevel}</TableCell>
                        <TableCell>{item.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="low">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items approaching their reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Suggested Level</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems
                    .filter((item) => item.status === "Low Stock")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.suggestedReorderLevel}</TableCell>
                        <TableCell>{item.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="overstocked">
          <Card>
            <CardHeader>
              <CardTitle>Overstocked Items</CardTitle>
              <CardDescription>Items with excess inventory that could be reduced</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Suggested Level</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems
                    .filter((item) => item.status === "Overstocked")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.suggestedReorderLevel}</TableCell>
                        <TableCell>{item.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
