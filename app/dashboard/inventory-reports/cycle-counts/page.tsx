"use client"

import { useState } from "react"
import { Calendar, Check, ClipboardCheck, Plus, Search } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

export default function CycleCountsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState(new Date())
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedFrequency, setSelectedFrequency] = useState("")
  const [selectedAuditor, setSelectedAuditor] = useState("")

  const [cycleCounts, setCycleCounts] = useState([
    {
      id: "CC-001",
      warehouse: "Main Warehouse",
      startDate: "2023-04-10",
      endDate: "2023-04-10",
      status: "Planned",
      itemCount: 25,
      assignedTo: "John Doe",
      priority: "High",
    },
    {
      id: "CC-002",
      warehouse: "East Warehouse",
      startDate: "2023-04-12",
      endDate: "2023-04-12",
      status: "Planned",
      itemCount: 18,
      assignedTo: "Jane Smith",
      priority: "Medium",
    },
    {
      id: "CC-003",
      warehouse: "Main Warehouse",
      startDate: "2023-04-05",
      endDate: "2023-04-05",
      status: "Completed",
      itemCount: 30,
      assignedTo: "John Doe",
      priority: "High",
    },
    {
      id: "CC-004",
      warehouse: "West Warehouse",
      startDate: "2023-04-08",
      endDate: "2023-04-08",
      status: "In Progress",
      itemCount: 15,
      assignedTo: "Mike Johnson",
      priority: "Low",
    },
  ])

  const filteredCounts = cycleCounts.filter(
    (count) =>
      count.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const createCycleCount = () => {
    const newCount = {
      id: `CC-00${cycleCounts.length + 1}`,
      warehouse: selectedWarehouse,
      startDate: format(date, "yyyy-MM-dd"),
      endDate: format(date, "yyyy-MM-dd"),
      status: "Planned",
      itemCount: Math.floor(Math.random() * 20) + 10,
      assignedTo: selectedAuditor,
      priority: selectedFrequency === "Daily" ? "High" : selectedFrequency === "Weekly" ? "Medium" : "Low",
    }
    setCycleCounts([newCount, ...cycleCounts])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cycle counts..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Count
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Cycle Count</DialogTitle>
                <DialogDescription>Create a new cycle count schedule for inventory verification.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warehouse" className="text-right">
                    Warehouse
                  </Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                      <SelectItem value="East Warehouse">East Warehouse</SelectItem>
                      <SelectItem value="West Warehouse">West Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Frequency
                  </Label>
                  <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="auditor" className="text-right">
                    Assigned To
                  </Label>
                  <Select value={selectedAuditor} onValueChange={setSelectedAuditor}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select auditor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="John Doe">John Doe</SelectItem>
                      <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                      <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createCycleCount}>Schedule Count</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Cycle Counts</CardTitle>
              <CardDescription>Scheduled inventory counts that have not yet started</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Count ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts
                    .filter((count) => count.status === "Planned")
                    .map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">{count.id}</TableCell>
                        <TableCell>{count.warehouse}</TableCell>
                        <TableCell>{count.startDate}</TableCell>
                        <TableCell>{count.itemCount}</TableCell>
                        <TableCell>{count.assignedTo}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              count.priority === "High"
                                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                : count.priority === "Medium"
                                  ? "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                                  : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                            }`}
                          >
                            {count.priority}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Start Count
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="in-progress">
          <Card>
            <CardHeader>
              <CardTitle>In Progress Counts</CardTitle>
              <CardDescription>Cycle counts that are currently being conducted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Count ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts
                    .filter((count) => count.status === "In Progress")
                    .map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">{count.id}</TableCell>
                        <TableCell>{count.warehouse}</TableCell>
                        <TableCell>{count.startDate}</TableCell>
                        <TableCell>{count.itemCount}</TableCell>
                        <TableCell>{count.assignedTo}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                          </div>
                          <span className="text-xs text-gray-500">45%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Check className="mr-2 h-4 w-4" />
                            Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Counts</CardTitle>
              <CardDescription>Cycle counts that have been completed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Count ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Variances</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts
                    .filter((count) => count.status === "Completed")
                    .map((count) => (
                      <TableRow key={count.id}>
                        <TableCell className="font-medium">{count.id}</TableCell>
                        <TableCell>{count.warehouse}</TableCell>
                        <TableCell>{count.startDate}</TableCell>
                        <TableCell>{count.itemCount}</TableCell>
                        <TableCell>{count.assignedTo}</TableCell>
                        <TableCell>3</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Report
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
