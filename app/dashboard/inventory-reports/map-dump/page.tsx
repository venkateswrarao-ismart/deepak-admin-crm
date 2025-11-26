"use client"

import { useState } from "react"
import { Download, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

export default function MAPDumpFilePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFields, setSelectedFields] = useState({
    articleId: true,
    articleName: true,
    mapPrice: true,
    costPrice: true,
    stockLevel: true,
    supplier: true,
  })
  const [dumpFiles, setDumpFiles] = useState([
    {
      id: 1,
      filename: "MAP_Dump_2023-04-01.csv",
      createdAt: "2023-04-01 09:15:22",
      createdBy: "John Doe",
      fileSize: "1.2 MB",
    },
    {
      id: 2,
      filename: "MAP_Dump_2023-03-15.csv",
      createdAt: "2023-03-15 14:30:45",
      createdBy: "Jane Smith",
      fileSize: "1.4 MB",
    },
    {
      id: 3,
      filename: "MAP_Dump_2023-03-01.csv",
      createdAt: "2023-03-01 10:22:18",
      createdBy: "John Doe",
      fileSize: "1.3 MB",
    },
  ])

  const filteredFiles = dumpFiles.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.createdBy.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const generateDumpFile = () => {
    const newFile = {
      id: dumpFiles.length + 1,
      filename: `MAP_Dump_${new Date().toISOString().split("T")[0]}.csv`,
      createdAt: new Date().toLocaleString(),
      createdBy: "Current User",
      fileSize: "1.5 MB",
    }
    setDumpFiles([newFile, ...dumpFiles])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
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
                Generate New Dump
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate MAP Dump File</DialogTitle>
                <DialogDescription>Select the fields to include in your MAP dump file.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="articleId"
                      checked={selectedFields.articleId}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, articleId: !!checked })}
                    />
                    <Label htmlFor="articleId">Article ID</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="articleName"
                      checked={selectedFields.articleName}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, articleName: !!checked })}
                    />
                    <Label htmlFor="articleName">Article Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mapPrice"
                      checked={selectedFields.mapPrice}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, mapPrice: !!checked })}
                    />
                    <Label htmlFor="mapPrice">MAP Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="costPrice"
                      checked={selectedFields.costPrice}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, costPrice: !!checked })}
                    />
                    <Label htmlFor="costPrice">Cost Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stockLevel"
                      checked={selectedFields.stockLevel}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, stockLevel: !!checked })}
                    />
                    <Label htmlFor="stockLevel">Stock Level</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="supplier"
                      checked={selectedFields.supplier}
                      onCheckedChange={(checked) => setSelectedFields({ ...selectedFields, supplier: !!checked })}
                    />
                    <Label htmlFor="supplier">Supplier Details</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={generateDumpFile}>Generate File</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MAP Dump Files</CardTitle>
          <CardDescription>Download inventory master data for external analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>{file.createdAt}</TableCell>
                  <TableCell>{file.createdBy}</TableCell>
                  <TableCell>{file.fileSize}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
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
