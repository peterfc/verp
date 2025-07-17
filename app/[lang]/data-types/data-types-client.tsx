"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteDialog } from "@/components/delete-dialog"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { DataType } from "@/types/data"

interface DataTypesClientPageProps {
  initialDataTypes: DataType[]
  lang: "en" | "es"
  dict: any // Using 'any' for simplicity, you can define a stricter type for the dictionary
  isAdmin: boolean
  isManager: boolean
}

export function DataTypesClientPage({ initialDataTypes, lang, dict, isAdmin, isManager }: DataTypesClientPageProps) {
  const [dataTypes, setDataTypes] = useState<DataType[]>(initialDataTypes)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dataTypeToDelete, setDataTypeToDelete] = useState<DataType | undefined>(undefined)
  const [loading, setLoading] = useState(false) // Initial load is done on server, so false
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDataTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/data-types")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: DataType[] = await response.json()
      setDataTypes(data)
    } catch (err: any) {
      const errorMessage = err.message || dict.dataTypesPage.failedToFetchDataTypes
      setError(errorMessage)
      toast({
        title: dict.common.error,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [dict, toast])

  const handleDeleteDataType = async () => {
    if (!dataTypeToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/data-types/${dataTypeToDelete.id}`, { method: "DELETE" })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || dict.dataTypesPage.failedToDeleteDataType
        throw new Error(message)
      }

      toast({
        title: dict.common.success,
        description: dict.dataTypesPage.dataTypeDeleted,
      })
      // Refresh data from the server after deletion
      await fetchDataTypes()
      setIsDeleteDialogOpen(false)
      setDataTypeToDelete(undefined)
    } catch (err: any) {
      const errorMessage = err.message || dict.dataTypesPage.failedToDeleteDataType
      setError(errorMessage)
      toast({
        title: dict.common.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const openDeleteConfirm = (dataType: DataType) => {
    setDataTypeToDelete(dataType)
    setIsDeleteDialogOpen(true)
  }

  const showActionsColumn = isAdmin || isManager

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.dataTypesPage.title}</CardTitle>
          {showActionsColumn && (
            <Link href={`/${lang}/data-types/new`}>
              <Button>{dict.common.add.replace("{itemType}", dict.dataTypesPage.title.toLowerCase())}</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">{dict.dataTypesPage.loadingDataTypes}</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {dict.common.error}: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.dataTypesPage.organization}</TableHead>
                  {showActionsColumn && <TableHead className="text-right">{dict.common.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActionsColumn ? 3 : 2} className="text-center py-4">
                      {dict.common.noDataFound.replace("{itemType}", dict.dataTypesPage.title.toLowerCase())}
                    </TableCell>
                  </TableRow>
                ) : (
                  dataTypes.map((dataType) => (
                    <TableRow key={dataType.id}>
                      <TableCell className="font-medium">{dataType.name}</TableCell>
                      <TableCell>{dataType.organization?.name || "N/A"}</TableCell>
                      {showActionsColumn && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{dict.common.actions}</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
                              <Link href={`/${lang}/data-types/edit/${dataType.id}`}>
                                <DropdownMenuItem>{dict.common.edit}</DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteConfirm(dataType)}>
                                {dict.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dataTypeToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteDataType}
          itemType={dict.dataTypesPage.title.toLowerCase()}
          itemName={dataTypeToDelete.name}
          dict={{
            confirmTitle: dict.common.confirmDeletion,
            confirmDescription: dict.common.confirmDeletionDescription,
            cancelButton: dict.common.cancel,
            deleteButton: dict.common.deleteButton,
          }}
        />
      )}
    </div>
  )
}
