"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { FileSpreadsheet, Download, Filter, RefreshCw, Loader2, Plus, Search, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

// Define the Article type based on the schema
type Article = {
  id: string
  name: string | null
  description: string | null
  mrp: number | null
  cost_price: number | null
}

// Define the MapDumpFile type based on the schema
type MapDumpFile = {
  map_id: number
  article_id: string
  map_price: number
  effective_date: string
  expiry_date: string | null
  uploaded_by: string
  created_at: string
  article_name?: string // Joined from articles table
}

// Define the history item type
type HistoryItem = {
  fileName: string
  date: Date
  user: string
}

export default function MapDumpPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [mapDumpFiles, setMapDumpFiles] = useState<MapDumpFile[]>([])
  const [filteredMapDumpFiles, setFilteredMapDumpFiles] = useState<MapDumpFile[]>([])
  const [effectiveDate, setEffectiveDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [expiryDate, setExpiryDate] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFields, setSelectedFields] = useState({
    articleId: true,
    articleName: true,
    mapPrice: true,
    effectiveDate: true,
    expiryDate: true,
  })
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newMapEntry, setNewMapEntry] = useState({
    articleId: "",
    mapPrice: "",
    effectiveDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: "",
  })
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [bulkMapPrice, setBulkMapPrice] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MapDumpFile | "article_name"
    direction: "asc" | "desc"
  }>({ key: "created_at", direction: "desc" })

  // Fetch articles and MAP dump files from Supabase
  useEffect(() => {
    async function fetchData() {
      setFetchingData(true)
      try {
        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from("articles")
          .select("id, name, description, mrp, cost_price")
          .order("id", { ascending: true })

        if (articlesError) {
          throw articlesError
        }

        setArticles(articlesData || [])

        // Fetch MAP dump files with article names
        const { data: mapData, error: mapError } = await supabase
          .from("mapdumpfiles")
          .select(`
            map_id,
            article_id,
            map_price,
            effective_date,
            expiry_date,
            uploaded_by,
            created_at,
            articles(name)
          `)
          .order("created_at", { ascending: false })

        if (mapError) {
          throw mapError
        }

        // Transform the data to include article_name
        const transformedMapData = (mapData || []).map((item) => ({
          ...item,
          article_name: item.articles?.name || "Unknown Article",
        }))

        setMapDumpFiles(transformedMapData)
        setFilteredMapDumpFiles(transformedMapData)

        // Generate history data from the map dump files
        const historyItems = (mapData || []).reduce((acc: HistoryItem[], item) => {
          // Check if we already have an entry for this date
          const dateStr = format(new Date(item.created_at), "yyyy-MM-dd")
          if (!acc.some((h) => format(h.date, "yyyy-MM-dd") === dateStr)) {
            acc.push({
              fileName: `MAP_Dump_${format(new Date(item.created_at), "yyyyMMdd")}.csv`,
              date: new Date(item.created_at),
              user: "Admin User", // In a real app, you would get the user name
            })
          }
          return acc
        }, [])

        setHistoryData(historyItems)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setFetchingData(false)
      }
    }

    fetchData()
  }, [supabase])

  // Filter map dump files when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMapDumpFiles(mapDumpFiles)
    } else {
      const lowercaseSearch = searchTerm.toLowerCase()
      const filtered = mapDumpFiles.filter(
        (item) =>
          item.article_id.toLowerCase().includes(lowercaseSearch) ||
          (item.article_name && item.article_name.toLowerCase().includes(lowercaseSearch)),
      )
      setFilteredMapDumpFiles(filtered)
    }
  }, [searchTerm, mapDumpFiles])

  // Sort map dump files
  useEffect(() => {
    const sortedFiles = [...filteredMapDumpFiles].sort((a, b) => {
      if (sortConfig.key === "article_name") {
        const aValue = a.article_name || ""
        const bValue = b.article_name || ""
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        } else {
          return 0
        }
      }
    })

    setFilteredMapDumpFiles(sortedFiles)
  }, [sortConfig])

  const handleSort = (key: keyof MapDumpFile | "article_name") => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }))
  }

  const refreshData = async () => {
    setFetchingData(true)
    try {
      // Fetch MAP dump files with article names
      const { data: mapData, error: mapError } = await supabase
        .from("mapdumpfiles")
        .select(`
          map_id,
          article_id,
          map_price,
          effective_date,
          expiry_date,
          uploaded_by,
          created_at,
          articles(name)
        `)
        .order("created_at", { ascending: false })

      if (mapError) {
        throw mapError
      }

      // Transform the data to include article_name
      const transformedMapData = (mapData || []).map((item) => ({
        ...item,
        article_name: item.articles?.name || "Unknown Article",
      }))

      setMapDumpFiles(transformedMapData)
      setFilteredMapDumpFiles(transformedMapData)

      toast({
        title: "Refreshed",
        description: "MAP dump data has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFetchingData(false)
    }
  }

  const generateCSV = (forDate?: Date) => {
    // Filter data by date if specified
    let dataToExport = mapDumpFiles
    if (forDate) {
      const dateStr = format(forDate, "yyyy-MM-dd")
      dataToExport = mapDumpFiles.filter((item) => format(new Date(item.created_at), "yyyy-MM-dd") === dateStr)
    }

    // Create header row based on selected fields
    const headers = []
    if (selectedFields.articleId) headers.push("Article ID")
    if (selectedFields.articleName) headers.push("Article Name")
    if (selectedFields.mapPrice) headers.push("MAP Price")
    if (selectedFields.effectiveDate) headers.push("Effective Date")
    if (selectedFields.expiryDate) headers.push("Expiry Date")

    // Create CSV content
    let csvContent = headers.join(",") + "\n"

    // Add data rows
    dataToExport.forEach((item) => {
      const row = []
      if (selectedFields.articleId) row.push(item.article_id || "")
      if (selectedFields.articleName) row.push(`"${item.article_name || ""}"`) // Quote strings to handle commas
      if (selectedFields.mapPrice) {
        const priceValue = Number(item.map_price).toFixed(2)
        row.push(priceValue)
      }
      if (selectedFields.effectiveDate) {
        const formattedDate = format(new Date(item.effective_date), "yyyy-MM-dd")
        row.push(formattedDate)
      }
      if (selectedFields.expiryDate) {
        const formattedDate = item.expiry_date ? format(new Date(item.expiry_date), "yyyy-MM-dd") : ""
        row.push(formattedDate)
      }
      csvContent += row.join(",") + "\n"
    })

    return csvContent
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      // Generate CSV content
      const csvContent = generateCSV()

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `MAP_Dump_${format(new Date(), "yyyyMMdd")}.csv`)

      // Append to the document, click it, and remove it
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL object
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "MAP dump file has been generated and downloaded.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadHistory = (fileName: string, date: Date) => {
    try {
      // Generate CSV content for the specific date
      const csvContent = generateCSV(date)

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)

      // Append to the document, click it, and remove it
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL object
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Historical MAP dump file has been downloaded.",
      })
    } catch (error) {
      console.error("Error downloading history:", error)
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddMapEntry = async () => {
    try {
      // Validate inputs
      if (!newMapEntry.articleId) {
        toast({
          title: "Error",
          description: "Please select an article.",
          variant: "destructive",
        })
        return
      }

      if (!newMapEntry.mapPrice || isNaN(Number(newMapEntry.mapPrice)) || Number(newMapEntry.mapPrice) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid MAP price.",
          variant: "destructive",
        })
        return
      }

      if (!newMapEntry.effectiveDate) {
        toast({
          title: "Error",
          description: "Please select an effective date.",
          variant: "destructive",
        })
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add MAP entries.",
          variant: "destructive",
        })
        return
      }

      // Insert new MAP entry
      const { data, error } = await supabase
        .from("mapdumpfiles")
        .insert({
          article_id: newMapEntry.articleId,
          map_price: Number(newMapEntry.mapPrice),
          effective_date: newMapEntry.effectiveDate,
          expiry_date: newMapEntry.expiryDate || null,
          uploaded_by: user.id,
        })
        .select()

      if (error) {
        throw error
      }

      // Refresh data
      await refreshData()

      // Reset form and close dialog
      setNewMapEntry({
        articleId: "",
        mapPrice: "",
        effectiveDate: format(new Date(), "yyyy-MM-dd"),
        expiryDate: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Success",
        description: "New MAP entry has been added.",
      })
    } catch (error) {
      console.error("Error adding MAP entry:", error)
      toast({
        title: "Error",
        description: "Failed to add MAP entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkAdd = async () => {
    try {
      if (selectedArticles.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one article.",
          variant: "destructive",
        })
        return
      }

      if (!bulkMapPrice || isNaN(Number(bulkMapPrice)) || Number(bulkMapPrice) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid MAP price.",
          variant: "destructive",
        })
        return
      }

      if (!effectiveDate) {
        toast({
          title: "Error",
          description: "Please select an effective date.",
          variant: "destructive",
        })
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add MAP entries.",
          variant: "destructive",
        })
        return
      }

      // Prepare bulk insert data
      const bulkData = selectedArticles.map((articleId) => ({
        article_id: articleId,
        map_price: Number(bulkMapPrice),
        effective_date: effectiveDate,
        expiry_date: expiryDate || null,
        uploaded_by: user.id,
      }))

      // Insert bulk MAP entries
      const { data, error } = await supabase.from("mapdumpfiles").insert(bulkData)

      if (error) {
        throw error
      }

      // Refresh data
      await refreshData()

      // Reset selections
      setSelectedArticles([])
      setBulkMapPrice("")

      toast({
        title: "Success",
        description: `Added MAP prices for ${selectedArticles.length} articles.`,
      })
    } catch (error) {
      console.error("Error adding bulk MAP entries:", error)
      toast({
        title: "Error",
        description: "Failed to add bulk MAP entries. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId],
    )
  }

  const selectAllArticles = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articles.map((article) => article.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MAP Dump Files</h2>
          <p className="text-muted-foreground">Manage and export Minimum Advertised Price data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={refreshData} disabled={fetchingData}>
            {fetchingData ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add MAP Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New MAP Entry</DialogTitle>
                <DialogDescription>Create a new Minimum Advertised Price entry for an article.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="article">Article</Label>
                  <Select
                    value={newMapEntry.articleId}
                    onValueChange={(value) => setNewMapEntry({ ...newMapEntry, articleId: value })}
                  >
                    <SelectTrigger id="article">
                      <SelectValue placeholder="Select an article" />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={article.id}>
                          {article.id} - {article.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="map-price">MAP Price</Label>
                  <Input
                    id="map-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMapEntry.mapPrice}
                    onChange={(e) => setNewMapEntry({ ...newMapEntry, mapPrice: e.target.value })}
                    placeholder="Enter MAP price"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="effective-date">Effective Date</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={newMapEntry.effectiveDate}
                    onChange={(e) => setNewMapEntry({ ...newMapEntry, effectiveDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={newMapEntry.expiryDate}
                    onChange={(e) => setNewMapEntry({ ...newMapEntry, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMapEntry}>Add Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current MAP Prices</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Update</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Current MAP Prices
              </CardTitle>
              <CardDescription>
                View and manage current Minimum Advertised Prices for articles.
                {fetchingData ? " Loading data..." : ` Found ${mapDumpFiles.length} MAP entries.`}
              </CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by article ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("article_id")}>
                        <div className="flex items-center">
                          Article ID
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("article_name")}>
                        <div className="flex items-center">
                          Article Name
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("map_price")}>
                        <div className="flex items-center">
                          MAP Price
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("effective_date")}>
                        <div className="flex items-center">
                          Effective Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("expiry_date")}>
                        <div className="flex items-center">
                          Expiry Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                        <div className="flex items-center">
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMapDumpFiles.length > 0 ? (
                      filteredMapDumpFiles.map((item) => (
                        <TableRow key={item.map_id}>
                          <TableCell className="font-medium">{item.article_id}</TableCell>
                          <TableCell>{item.article_name}</TableCell>
                          <TableCell>{Number(item.map_price).toFixed(2)}</TableCell>
                          <TableCell>{format(new Date(item.effective_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            {item.expiry_date ? format(new Date(item.expiry_date), "MMM dd, yyyy") : "No expiry"}
                          </TableCell>
                          <TableCell>{format(new Date(item.created_at), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {fetchingData
                            ? "Loading data..."
                            : searchTerm
                              ? "No matching MAP entries found."
                              : "No MAP entries found. Add some using the 'Add MAP Entry' button."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Update MAP Prices
              </CardTitle>
              <CardDescription>
                Update MAP prices for multiple articles at once.
                {fetchingData ? " Loading article data..." : ` Found ${articles.length} articles.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-map-price">MAP Price for Selected Articles</Label>
                  <Input
                    id="bulk-map-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkMapPrice}
                    onChange={(e) => setBulkMapPrice(e.target.value)}
                    placeholder="Enter MAP price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-effective-date">Effective Date</Label>
                  <Input
                    id="bulk-effective-date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="bulk-expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedArticles.length === articles.length && articles.length > 0}
                    onCheckedChange={selectAllArticles}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {selectedArticles.length} of {articles.length} articles selected
                  </span>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Select</TableHead>
                      <TableHead>Article ID</TableHead>
                      <TableHead>Article Name</TableHead>
                      <TableHead>Current MRP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.length > 0 ? (
                      articles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedArticles.includes(article.id)}
                              onCheckedChange={() => toggleArticleSelection(article.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{article.id}</TableCell>
                          <TableCell>{article.name}</TableCell>
                          <TableCell>{article.mrp ? Number(article.mrp).toFixed(2) : "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {fetchingData ? "Loading articles..." : "No articles found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleBulkAdd}
                  disabled={fetchingData || selectedArticles.length === 0 || !bulkMapPrice}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add MAP Prices for Selected Articles
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Generate MAP Dump File
              </CardTitle>
              <CardDescription>Select options to generate a customized MAP dump file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Include Fields</Label>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="article-id"
                        checked={selectedFields.articleId}
                        onCheckedChange={() => handleFieldToggle("articleId")}
                      />
                      <Label htmlFor="article-id">Article ID</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="article-name"
                        checked={selectedFields.articleName}
                        onCheckedChange={() => handleFieldToggle("articleName")}
                      />
                      <Label htmlFor="article-name">Article Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="map-price"
                        checked={selectedFields.mapPrice}
                        onCheckedChange={() => handleFieldToggle("mapPrice")}
                      />
                      <Label htmlFor="map-price">MAP Price</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="effective-date-field"
                        checked={selectedFields.effectiveDate}
                        onCheckedChange={() => handleFieldToggle("effectiveDate")}
                      />
                      <Label htmlFor="effective-date-field">Effective Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expiry-date"
                        checked={selectedFields.expiryDate}
                        onCheckedChange={() => handleFieldToggle("expiryDate")}
                      />
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading || fetchingData || mapDumpFiles.length === 0}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Generate & Download
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previous MAP Dump Files</CardTitle>
              <CardDescription>Access and download previously generated MAP dump files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Search files..." className="max-w-sm" />
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium">
                    <div>File Name</div>
                    <div>Generated Date</div>
                    <div>Generated By</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {historyData.length > 0 ? (
                    historyData.map((item, i) => (
                      <div key={i} className="grid grid-cols-4 gap-4 border-t p-4">
                        <div>{item.fileName}</div>
                        <div>{format(item.date, "MMM dd, yyyy")}</div>
                        <div>{item.user}</div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadHistory(item.fileName, item.date)}
                            disabled={fetchingData}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No history found. Generate a new MAP dump file to see it here.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
