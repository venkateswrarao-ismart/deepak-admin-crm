"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

// Update the DataTableProps interface to include server-side pagination options
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchColumn?: string | string[] // Modified to accept string or string array
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  showGstColumn?: boolean
  hierarchical?: boolean
  // Server-side pagination props
  serverSide?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  totalCount?: number
  onPaginationChange?: (pageIndex: number, pageSize: number) => void
}

// Update the DataTable component to accept the new props
export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search by name, vendor, or other details...",
  isLoading = false,
  emptyMessage = "No data found. If you recently created an item, it may take a moment to appear or you might need to refresh the page.",
  showGstColumn = false,
  hierarchical = false,
  // Server-side pagination props
  serverSide = false,
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  totalCount = 0,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [visibleRowsCount, setVisibleRowsCount] = useState(0)
  const [localPageSize, setLocalPageSize] = useState(hierarchical ? (data.length > 0 ? data.length : 100) : pageSize)
  const [localPageIndex, setLocalPageIndex] = useState(pageIndex)

  // Add GST column dynamically if showGstColumn is true
  const tableColumns = React.useMemo(() => {
    if (showGstColumn && data.length > 0 && "gst_percentage" in data[0]) {
      // Check if GST column already exists in the columns definition
      const gstColumnExists = columns.some((col) => "accessorKey" in col && col.accessorKey === "gst_percentage")

      if (!gstColumnExists) {
        return [
          ...columns,
          {
            accessorKey: "gst_percentage",
            header: "GST %",
            cell: ({ row }) => {
              const gst = row.getValue("gst_percentage") as number | null
              return gst !== null ? `${gst}%` : "-"
            },
          } as ColumnDef<TData, TValue>,
        ]
      }
    }
    return columns
  }, [columns, data, showGstColumn])

  // Handle server-side pagination
  const handlePaginationChange = (newPageIndex: number, newPageSize: number) => {
    if (serverSide && onPaginationChange) {
      setLocalPageIndex(newPageIndex)
      setLocalPageSize(newPageSize)
      onPaginationChange(newPageIndex, newPageSize)
    }
  }

  // Update local state when props change
  useEffect(() => {
    if (serverSide) {
      setLocalPageIndex(pageIndex)
      setLocalPageSize(pageSize)
    }
  }, [serverSide, pageIndex, pageSize])

  // Add this function before the table initialization
  const safeGetHeaderGroups = () => {
    try {
      return table.getHeaderGroups()
    } catch (error) {
      console.error("Error getting header groups:", error)
      return []
    }
  }

  // Add this before the table initialization
  const validColumns = React.useMemo(() => {
    if (!Array.isArray(tableColumns) || tableColumns.length === 0) {
      console.error("Invalid columns definition:", tableColumns)
      return [{ accessorKey: "id", header: "ID" }] // Fallback column
    }
    return tableColumns
  }, [tableColumns])

  const table = useReactTable({
    data,
    columns: validColumns,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side pagination if not server-side
    ...(serverSide ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: serverSide,
    pageCount: serverSide ? pageCount : undefined,
    initialState: {
      pagination: {
        pageSize: hierarchical ? (data.length > 0 ? data.length : 100) : localPageSize,
        pageIndex: localPageIndex,
      },
    },
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageSize: localPageSize,
        pageIndex: localPageIndex,
      },
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === "function" ? updater(table.getState().pagination) : updater

      if (serverSide) {
        handlePaginationChange(newState.pageIndex, newState.pageSize)
      } else {
        if (newState.pageSize !== localPageSize) {
          setLocalPageSize(newState.pageSize)
        }
        if (newState.pageIndex !== localPageIndex) {
          setLocalPageIndex(newState.pageIndex)
        }
      }
    },
  })

  // Calculate visible rows for hierarchical data
  useEffect(() => {
    if (hierarchical && !serverSide) {
      const allRows = table.getRowModel().rows

      // Find all top-level categories (parent_id is null)
      const topLevelRows = allRows.filter(
        (row) => !row.original || !("parent_id" in row.original) || !row.original.parent_id,
      )

      // Calculate pagination for top-level rows
      const currentPageSize = table.getState().pagination.pageSize
      const currentPageIndex = table.getState().pagination.pageIndex
      const start = currentPageIndex * currentPageSize
      const end = Math.min(start + currentPageSize, topLevelRows.length)

      // Get only the top-level rows for the current page
      const paginatedTopLevelRows = topLevelRows.slice(start, end)

      let count = 0

      // Count parent rows and their children
      paginatedTopLevelRows.forEach((row) => {
        count++ // Count the parent row

        const rowId = row.original?.id
        if (rowId) {
          // Count child rows
          const childRows = allRows.filter(
            (childRow) =>
              childRow.original && "parent_id" in childRow.original && childRow.original.parent_id === rowId,
          )
          count += childRows.length
        }
      })

      setVisibleRowsCount(count)
    } else if (serverSide) {
      // For server-side pagination, the visible rows count is just the data length
      setVisibleRowsCount(data.length)
    }
  }, [
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize,
    table.getRowModel().rows,
    hierarchical,
    serverSide,
    data.length,
  ])

  // Set page size to show all records for hierarchical data when data changes
  useEffect(() => {
    if (hierarchical && !serverSide && data.length > 0) {
      setLocalPageSize(data.length)
      table.setPageSize(data.length)
    }
  }, [hierarchical, serverSide, data.length])

  // Get the appropriate row count based on pagination mode
  const getRowCount = () => {
    if (serverSide) {
      return totalCount
    } else {
      return table.getFilteredRowModel().rows.length
    }
  }

  // Get the appropriate page count based on pagination mode
  const getPageCount = () => {
    if (serverSide) {
      return pageCount
    } else if (hierarchical) {
      return (
        Math.ceil(
          table
            .getFilteredRowModel()
            .rows.filter((row) => !row.original || !("parent_id" in row.original) || !row.original.parent_id).length /
            localPageSize,
        ) || 1
      )
    } else {
      return table.getPageCount() || 1
    }
  }

  // Get the start index of the current page
  const getPageStartIndex = () => {
    if (getRowCount() === 0) return 0
    return localPageIndex * localPageSize + 1
  }

  // Get the end index of the current page
  const getPageEndIndex = () => {
    if (serverSide) {
      return Math.min((localPageIndex + 1) * localPageSize, totalCount)
    } else {
      return Math.min((localPageIndex + 1) * localPageSize, getRowCount())
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {hierarchical && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPageSize = data.length > 0 ? data.length : 100
              setLocalPageSize(newPageSize)
              table.setPageSize(newPageSize)
              table.setPageIndex(0)
            }}
          >
            View All Categories
          </Button>
        </div>
      )}
      {searchColumn && (
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || "Search by name, vendor, or other details..."}
              value={
                (table
                  .getColumn(Array.isArray(searchColumn) ? searchColumn[0] : searchColumn)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) => {
                const value = event.target.value

                // Global filter approach for multiple columns
                if (Array.isArray(searchColumn)) {
                  // Clear any existing column filters first
                  searchColumn.forEach((column) => {
                    if (table.getColumn(column)) {
                      table.getColumn(column)?.setFilterValue(undefined)
                    }
                  })

                  // Set up a custom filter function for the first column that checks all specified columns
                  if (searchColumn.length > 0 && table.getColumn(searchColumn[0])) {
                    table.getColumn(searchColumn[0])?.setFilterValue(value)

                    // Set up a custom filter function
                    if (value) {
                      const firstColumn = table.getColumn(searchColumn[0])
                      if (firstColumn) {
                        firstColumn.columnDef.filterFn = (row, columnId, filterValue) => {
                          if (!filterValue) return true

                          // Convert filter value to lowercase for case-insensitive comparison
                          const searchTerm = String(filterValue).toLowerCase()

                          // Check each specified column
                          for (const colId of searchColumn) {
                            const cellValue = row.getValue(colId)
                            if (cellValue !== null && cellValue !== undefined) {
                              const cellValueStr = String(cellValue).toLowerCase()
                              if (cellValueStr.includes(searchTerm)) {
                                return true
                              }
                            }
                          }

                          // Also check vendor-related fields if they exist
                          const rowData = row.original
                          if (rowData) {
                            // Check for vendor name in various possible field structures
                            const vendorFields = [
                              rowData.vendor?.name,
                              rowData.vendor_name,
                              rowData.vendorName,
                              rowData.supplier?.name,
                              rowData.supplier_name,
                              rowData.supplierName,
                            ]

                            for (const vendorField of vendorFields) {
                              if (vendorField && String(vendorField).toLowerCase().includes(searchTerm)) {
                                return true
                              }
                            }

                            // Check nested vendor objects
                            if (rowData.vendor && typeof rowData.vendor === "object") {
                              const vendorStr = JSON.stringify(rowData.vendor).toLowerCase()
                              if (vendorStr.includes(searchTerm)) {
                                return true
                              }
                            }
                          }

                          return false
                        }
                      }
                    }
                  }
                } else {
                  // Single column filtering with vendor name enhancement
                  const column = table.getColumn(searchColumn)
                  if (column) {
                    column.setFilterValue(value)

                    // Enhance single column search to also include vendor names
                    if (value) {
                      column.columnDef.filterFn = (row, columnId, filterValue) => {
                        if (!filterValue) return true

                        const searchTerm = String(filterValue).toLowerCase()

                        // Check the primary column
                        const cellValue = row.getValue(columnId)
                        if (cellValue !== null && cellValue !== undefined) {
                          const cellValueStr = String(cellValue).toLowerCase()
                          if (cellValueStr.includes(searchTerm)) {
                            return true
                          }
                        }

                        // Also check vendor-related fields
                        const rowData = row.original
                        if (rowData) {
                          const vendorFields = [
                            rowData.vendor?.name,
                            rowData.vendor_name,
                            rowData.vendorName,
                            rowData.supplier?.name,
                            rowData.supplier_name,
                            rowData.supplierName,
                          ]

                          for (const vendorField of vendorFields) {
                            if (vendorField && String(vendorField).toLowerCase().includes(searchTerm)) {
                              return true
                            }
                          }
                        }

                        return false
                      }
                    }
                  }
                }
              }}
              className="pl-8"
            />
          </div>
          {showGstColumn && <div className="text-sm text-muted-foreground">Showing GST percentages for articles</div>}
        </div>
      )}

      <div className="rounded-md border">
        {hierarchical && !serverSide ? (
          <Table>
            <TableHeader>
              {safeGetHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground">
                              {{
                                asc: " ↑",
                                desc: " ↓",
                              }[header.column.getIsSorted() as string] ?? " "}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                (() => {
                  // For hierarchical data, we need to handle pagination manually
                  const allRows = table.getRowModel().rows

                  // Find all top-level categories (parent_id is null)
                  const topLevelRows = allRows.filter(
                    (row) => !row.original || !("parent_id" in row.original) || !row.original.parent_id,
                  )

                  // Calculate pagination for top-level rows
                  const currentPageSize = localPageSize
                  const currentPageIndex = localPageIndex
                  const start = currentPageIndex * currentPageSize
                  const end = Math.min(start + currentPageSize, topLevelRows.length)

                  // Get only the top-level rows for the current page
                  const paginatedTopLevelRows = topLevelRows.slice(start, end)

                  // Render function for a row and its children
                  const renderRowWithChildren = (row: any) => {
                    const rowId = row.original?.id

                    // Find children of this row
                    const childRows = rowId
                      ? allRows.filter(
                          (childRow) =>
                            childRow.original &&
                            "parent_id" in childRow.original &&
                            childRow.original.parent_id === rowId,
                        )
                      : []

                    return (
                      <React.Fragment key={row.id}>
                        <TableRow data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                        {childRows.map((childRow) => (
                          <TableRow
                            key={childRow.id}
                            data-state={childRow.getIsSelected() && "selected"}
                            className="bg-muted/30"
                          >
                            {childRow.getVisibleCells().map((cell, i) => (
                              <TableCell key={cell.id}>
                                {i === 0 && <span className="inline-block w-6 text-muted-foreground">↳</span>}
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    )
                  }

                  return paginatedTopLevelRows.map(renderRowWithChildren)
                })()
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    <p className="text-green-600">{emptyMessage}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              {safeGetHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground">
                              {{
                                asc: " ↑",
                                desc: " ↓",
                              }[header.column.getIsSorted() as string] ?? " "}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.column.id === "isactive" ? (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={cell.getValue() === true}
                              onCheckedChange={async (checked) => {
                                try {
                                  const supabase = createClient()
                                  const { error } = await supabase
                                    .from("products")
                                    .update({ isactive: checked })
                                    .eq("id", row.original.id)

                                  if (error) throw error

                                  // Update the local data to reflect the change
                                  const updatedData = [...data]
                                  const rowIndex = updatedData.findIndex((item) => item.id === row.original.id)
                                  if (rowIndex !== -1) {
                                    updatedData[rowIndex].isactive = checked
                                    // If using state to manage data, update it here
                                  }

                                  toast({
                                    title: checked ? "Product activated" : "Product deactivated",
                                    description: `${row.original.name} has been ${checked ? "activated" : "deactivated"}.`,
                                  })
                                } catch (error) {
                                  console.error("Error updating product status:", error)
                                  toast({
                                    title: "Error",
                                    description: "Failed to update product status.",
                                    variant: "destructive",
                                  })
                                }
                              }}
                              aria-label="Toggle product active state"
                            />
                            <span className="text-sm">{cell.getValue() === true ? "Active" : "Inactive"}</span>
                          </div>
                        ) : cell.column.id === "cost_price" ||
                          cell.column.id === "price" ||
                          cell.column.id === "selling_price" ? (
                          // Special handling for price columns to show dash when null
                          cell.getValue() === null ? (
                            "—"
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    <p className="text-green-600">{emptyMessage}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {hierarchical && !serverSide ? (
            <>
              Showing page {localPageIndex + 1} of {getPageCount()}
              <span className="ml-1">({visibleRowsCount} records)</span>
            </>
          ) : (
            <>
              Showing {getPageStartIndex()} to {getPageEndIndex()} of {getRowCount()} entries
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Simplified pagination controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (serverSide) {
                handlePaginationChange(Math.max(0, localPageIndex - 1), localPageSize)
              } else {
                table.previousPage()
              }
            }}
            disabled={localPageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <span className="text-sm font-medium">
            Page {localPageIndex + 1} of {getPageCount()}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (serverSide) {
                handlePaginationChange(Math.min(getPageCount() - 1, localPageIndex + 1), localPageSize)
              } else {
                table.nextPage()
              }
            }}
            disabled={localPageIndex >= getPageCount() - 1}
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Select
            value={String(localPageSize)}
            onValueChange={(value) => {
              const newPageSize = value === "all" ? (data.length > 0 ? data.length : 100) : Number(value)
              if (serverSide) {
                handlePaginationChange(0, newPageSize) // Reset to first page when changing page size
              } else {
                setLocalPageSize(newPageSize)
                table.setPageSize(newPageSize)
                table.setPageIndex(0) // Reset to first page when changing page size
              }
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={localPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50, 100,200,500,1000].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div> 
  )
}
