"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  dict: any
  isAdmin: boolean
  isManager: boolean
}

export function DataTypesClientPage({ initialDataTypes, lang, dict, isAdmin, isManager }: DataTypesClientPageProps) {
  const [dataTypes, setDataTypes] = useState<DataType[]>(initialDataTypes)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dataTypeToDelete, setDataTypeToDelete] = useState<DataType | undefined>(undefined)
  const { toast } = useToast()
  const router = useRouter()

  // Update state if initial props change (e.g., due to router.refresh())
  useEffect(() => {
    setDataTypes(initialDataTypes)
  }, [initialDataTypes])

  const handleDeleteDataType = async () => {
    if (!dataTypeToDelete) return

    try {
      const response = await fetch(`/api/data-types/${dataTypeToDelete.id}`, { method: "DELETE" })

      if (!response.ok) {
        let message = dict?.dataTypesPage.failedToDeleteDataType || "Failed to delete data type."
        try {
          const errorData = await response.json()
          if (errorData?.error) message = errorData.error
        } catch {
          // Ignore if response is not JSON
        }
        throw new Error(message)
      }

      toast({
        title: dict?.common.success || "Success",
        description: dict?.dataTypesPage.dataTypeDeleted || "Data Type deleted successfully.",
      })

      // Optimistically update UI and then refresh server data
      setDataTypes((prev) => prev.filter((dt) => dt.id !== dataTypeToDelete.id))
      setIsDeleteDialogOpen(false)
      setDataTypeToDelete(undefined)
      router.refresh()
    } catch (err: any) {
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.dataTypesPage.failedToDeleteDataType,
        variant: "destructive",
      })
      console.error(err)
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
          {(isAdmin || isManager) && (
            <Link href={`/${lang}/data-types/new`}>
              <Button>{dict.common.add.replace("{itemType}", dict.dataTypesPage.title)}</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
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
                            {(isAdmin || isManager) && (
                              <Link href={`/${lang}/data-types/edit/${dataType.id}`}>
                                <DropdownMenuItem>{dict.common.edit}</DropdownMenuItem>
                              </Link>
                            )}
                            <DropdownMenuSeparator />
                            {(isAdmin || isManager) && (
                              <DropdownMenuItem onClick={() => openDeleteConfirm(dataType)}>
                                {dict.common.delete}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            confirmDescription: dict.common.confirmDeletionDescription
              .replace("{itemType}", dict.dataTypesPage.title.toLowerCase())
              .replace("{itemName}", `"${dataTypeToDelete.name}"`),
            cancelButton: dict.common.cancel,
            deleteButton: dict.common.deleteButton,
          }}
        />
      )}
    </div>
  )
}
