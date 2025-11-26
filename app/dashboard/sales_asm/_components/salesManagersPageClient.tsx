"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { Phone, Search, UserCog } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

export default function SalesManagersPageClient({
  managers,
  count,
  search,
}: { 
  managers: any[] 
  count: number
  search: string
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedManager, setSelectedManager] = useState<any>(null)
  const [managerList, setManagerList] = useState(managers)

  const handleSearch = (formData: FormData) => {
    const searchValue = formData.get("search")?.toString() || ""
    const params = new URLSearchParams()
    if (searchValue) params.set("search", searchValue)
    router.push(`/dashboard/sales_asm?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!selectedManager) return

    const supabase = createClient()
    const { error } = await supabase
      .from("sales_managers")
      .delete()
      .eq("id", selectedManager.id)

    if (error) {
      console.error("Delete error:", error)
    } else {
      setManagerList((prev) => prev.filter((m) => m.id !== selectedManager.id))
    }

    setShowDeleteDialog(false)
    setSelectedManager(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: any }) => {
        const manager = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {manager.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <div className="font-medium">{manager.name || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground">ID: {manager.id.substring(0, 8)}...</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }: { row: any }) => {
        const phone = row.getValue("phone")
        return phone ? (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No phone</span>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }: { row: any }) => formatDate(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/sales_asm/${row.original.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSelectedManager(row.original)
              setShowDeleteDialog(true)
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Managers</h1>
        <Link href="/dashboard/sales_asm/new">
          <Button>Add ASM</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerList.length}</div>
            <p className="text-xs text-muted-foreground">Managers registered in the system</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <form
          className="flex items-center gap-2"
          action={handleSearch}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search managers by name or phone..."
            name="search"
            defaultValue={search}
            className="max-w-sm"
          />
        </form>

        <Card className="p-4">
          <CardHeader>
            <CardTitle>Manager List</CardTitle>
            <CardDescription>Manage your sales managers and view their details.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={managerList} />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Manager</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{selectedManager?.name}</strong>?</p>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
