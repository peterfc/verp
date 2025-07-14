"use client"

import { useState, useEffect, useCallback } from "react"
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
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Organization {
  id: string
  name: string
}

interface DataType {
  id: string
  name: string
  fields: any
  organization_id: string
  organization?: { name: string }
}

export default function DataTypesPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const [dataTypes, setDataTypes] = useState<DataType[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dataTypeToDelete, setDataTypeToDelete] = useState<DataType | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: profile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
        if (error) {
          console.error("Error fetching user profile type:", error)
        } else if (profile) {
          setIsAdmin(profile.type === "Administrator")
          setIsManager(profile.type === "Manager")
        }
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch(`/api/dictionaries/data-types/${lang}`)
        if (!response.ok) {
          throw new Error("Failed to fetch data types dictionary")
        }
        const data = await response.json()
        setDict(data)
      } catch (err) {
        console.error(err)
        setDict({
          dataTypesPage: {
            title: "Data Types",
            loadingDataTypes: "Loading data types...",
            failedToFetchDataTypes: "Failed to fetch data types.",
            dataTypeSaved: "Data Type saved successfully.",
            dataTypeDeleted: "Data Type deleted successfully.",
            failedToSaveDataType: "Failed to save data type.",
            failedToDeleteDataType: "Failed to delete data type.",
            organization: "Organization",
          },
          dataTypeForm: {
            editTitle: "Edit Data Type",
            addTitle: "Add Data Type",
            editDescription: "Make changes to the data type here.",
            addDescription: "Add a new data type to your list.",
            nameLabel: "Name",
            fieldsLabel: "Fields (JSON)",
            organizationLabel: "Organization",
            saveChangesButton: "Save changes",
            addDataTypeButton: "Add Data Type",
            errorFetchingOrganizations: "Error fetching organizations",
            failedToLoadOrganizations: "Failed to load organizations for selection.",
            invalidJson: "Invalid JSON",
          },
          dataTypeEditor: {
            editorTitle: "Data Type Editor",
            editorDescription: "Create or edit your data type schema.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Save Data Type",
            cancelButton: "Cancel",
            invalidJson: "Invalid JSON",
            noOrganizationSelected: "Please select an organization.",
            noOrganizationsFound: "No organizations found.",
            addFieldButton: "Add Field",
            removeFieldButton: "Remove Field",
            fieldTypeOptions: {
              string: "String",
              number: "Number",
              boolean: "Boolean",
              date: "Date",
              json: "JSON",
              dropdown: "Dropdown",
              file: "File",
            },
            dropdownOptionsLabel: "Dropdown Options",
            dropdownOptionsPlaceholder: "Enter options separated by commas (e.g., Option 1, Option 2, Option 3)",
          },
          common: {
            name: "Name",
            email: "Email",
            actions: "Actions",
            edit: "Edit",
            delete: "Delete",
            saveChanges: "Save changes",
            cancel: "Cancel",
            loading: "Loading...",
            error: "Error",
            success: "Success",
            noDataFound: "No {itemType} found.",
            confirmDeletion: "Confirm Deletion",
            confirmDeletionDescription:
              'Are you sure you want to delete the {itemType} "{itemName}"? This action cannot be undone.',
            deleteButton: "Delete",
            add: "Add {itemType}",
          },
        })
      }
    }
    loadDictionary()
  }, [lang])

  const fetchDataTypes = useCallback(async () => {
    if (!dict) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/data-types")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const ct = response.headers.get("content-type") || ""
      if (response.status === 204 || !ct.includes("application/json")) {
        setDataTypes([])
        return
      }

      const data: DataType[] = await response.json()
      setDataTypes(data)
    } catch (err: any) {
      setError(err.message || dict?.dataTypesPage.failedToFetchDataTypes || "Failed to fetch data types.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.dataTypesPage.failedToFetchDataTypes || "Failed to fetch data types.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dict, toast])

  useEffect(() => {
    if (dict) {
      fetchDataTypes()
    }
  }, [fetchDataTypes, dict])

  const handleDeleteDataType = async () => {
    if (!dataTypeToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/data-types/${dataTypeToDelete.id}`, { method: "DELETE" })

      if (!response.ok) {
        let message = dict?.dataTypesPage.failedToDeleteDataType || "Failed to delete data type."

        try {
          const maybeJson = await response.clone().json()
          if (maybeJson?.error && String(maybeJson.error).trim()) {
            message = maybeJson.error
          } else if (response.statusText.trim()) {
            message = response.statusText
          } else {
            message = `HTTP ${response.status} error`
          }
        } catch {
          message = response.statusText.trim() || `HTTP ${response.status} error`
        }
        throw new Error(message)
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.dataTypesPage.dataTypeDeleted || "Data Type deleted successfully.",
      })
      fetchDataTypes()
      setIsDeleteDialogOpen(false)
      setDataTypeToDelete(undefined)
    } catch (err: any) {
      setError(err.message || dict?.dataTypesPage.failedToDeleteDataType || "Failed to delete data type.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.dataTypesPage.failedToDeleteDataType || "Failed to delete data type.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openDeleteConfirm = (dataType: DataType) => {
    setDataTypeToDelete(dataType)
    setIsDeleteDialogOpen(true)
  }

  if (!dict) return null

  // Determine if actions column should be visible
  const showActionsColumn = isAdmin || isManager

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.dataTypesPage.title}</CardTitle>
          {(isAdmin || isManager) && (
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
