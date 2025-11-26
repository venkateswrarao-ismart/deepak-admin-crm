"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Check, Download, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function CycleCountDetailPage() {
  const params = useParams()
  const { id } = params

  const [cycleCount, setCycleCount] = useState({
    id: id,
    warehouse: "Main Warehouse",
    startDate: "2023-04-10",
    endDate: "2023-04-10",
    status: "In Progress",
    assignedTo: "John Doe",
    items: [
      {
        id: 1,
        articleId: "10001",
        articleName: "Product A",
        expectedQty: 150,
        countedQty: 148,
        variance: -2,
        remarks: "",
        binLocation: "A1-01",
      },
      {
        id: 2,
        articleId: "10002",
        articleName: "Product B",
        expectedQty: 75,
        countedQty: 75,
        variance: 0,
        remarks: "",
        binLocation: "A1-02",
      },
      {
        id: 3,
        articleId: "10003",
        articleName: "Product C",
        expectedQty: 50,
        countedQty: 52,
        variance: 2,
        remarks: "",
        binLocation: "A2-01",
      },
      {
        id: 4,
        articleId: "10004",
        articleName: "Product D",
        expectedQty: 25,
        countedQty: null,
        variance: null,
        remarks: "",
        binLocation: "A2-02",
      },
      {
        id: 5,
        articleId: "10005",
        articleName: "Product E",
        expectedQty: 100,
        countedQty: null,
        variance: null,
        remarks: "",
        binLocation: "A3-01",
      },
    ],
  })

  const updateCountedQty = (id, value) => {
    const updatedItems = cycleCount.items.map((item) => {
      if (item.id === id) {
        const countedQty = value === "" ? null : Number.parseInt(value)
        const variance = countedQty !== null ? countedQty - item.expectedQty : null
        return {
          ...item,
          countedQty,
          variance,
        }
      }
      return item
    })

    setCycleCount({
      ...cycleCount,
      items: updatedItems,
    })
  }

  const updateRemarks = (id, value) => {
    const updatedItems = cycleCount.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          remarks: value,
        }
      }
      return item
    })

    setCycleCount({
      ...cycleCount,
      items: updatedItems,
    })
  }

  const completeCycleCount = () => {
    setCycleCount({
      ...cycleCount,
      status: "Completed",
      endDate: new Date().toISOString().split("T")[0],
    })
  }

  const saveProgress = () => {
    // In a real app, this would save to the database
    console.log("Saving progress...")
  }

  const countProgress = Math.round(
    (cycleCount.items.filter((item) => item.countedQty !== null).length / cycleCount.items.length) * 100,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/inventory-reports/cycle-counts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cycle Counts
            </Button>
          </Link>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={saveProgress}>
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
          <Button onClick={completeCycleCount}>
            <Check className="mr-2 h-4 w-4" />
            Complete Count
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cycle Count: {cycleCount.id}</CardTitle>
              <CardDescription>
                {cycleCount.warehouse} • {cycleCount.startDate}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Status</div>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  cycleCount.status === "Completed"
                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                    : cycleCount.status === "In Progress"
                      ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10"
                      : "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                }`}
              >
                {cycleCount.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${countProgress}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{countProgress}% Complete</div>
          </div>

          <Separator className="my-4" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Expected Qty</TableHead>
                <TableHead>Counted Qty</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleCount.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.articleId}</TableCell>
                  <TableCell>{item.articleName}</TableCell>
                  <TableCell>{item.binLocation}</TableCell>
                  <TableCell>{item.expectedQty}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.countedQty === null ? "" : item.countedQty}
                      onChange={(e) => updateCountedQty(item.id, e.target.value)}
                      className="w-20"
                      disabled={cycleCount.status === "Completed"}
                    />
                  </TableCell>
                  <TableCell>
                    {item.variance !== null && (
                      <span className={item.variance < 0 ? "text-red-600" : item.variance > 0 ? "text-green-600" : ""}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Textarea
                      placeholder="Add remarks..."
                      value={item.remarks}
                      onChange={(e) => updateRemarks(item.id, e.target.value)}
                      className="min-h-[60px] w-[200px]"
                      disabled={cycleCount.status === "Completed"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
