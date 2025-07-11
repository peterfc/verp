"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DynamicDataEntryForm } from "@/components/dynamic-data-entry-form" // Import the new DynamicDataEntryForm
import { DeleteDialog } from "@/components/delete-dialog" // For deleting entries
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus } from "lucide-react"
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
import type { User } from "@supabase/supabase-js" // Import User type

interface Field {
  name: string
  type: string
  options?: string[] // Corrected to string[]
}

interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string }
}

interface DynamicDataEntry {
  id: string
  data_type_id: string
  organization_id: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

interface DynamicDataTypePageProps {
  params: {
    lang: string
    organizationId: string
    dataTypeId: string
    dataTypeNameSlug: string
  }
  searchParams: {
    editEntryId?: string
  }
}

export default function DynamicDataPage({
  params: { lang, organizationId, dataTypeId, dataTypeNameSlug },
}: {
  params: { lang: "en" | "es"; organizationId: string; dataTypeId: string; dataTypeNameSlug: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  // Local “never-undefined” helper.
  // If dict or dict.dynamicDataPage are missing we fall back to
  // the minimal strings below, avoiding runtime crashes.
  const dynamicDictDefaults = {
    title: "Data Entries",
    loadingEntries: "Loading entries...",
    failedToFetchEntries: "Failed to fetch entries.",
    entrySaved: "Entry saved.",
    entryDeleted: "Entry deleted.",
    failedToSaveEntry: "Failed to save entry.",
    failedToDeleteEntry: "Failed to delete entry.",
    addEntry: "Add Entry",
    noEntriesFound: "No entries yet.",
  }

  // Whenever we need the dynamic-data-page copy, read from this merged object.
  const dynamicDict = {
    ...dynamicDictDefaults,
    ...(dict?.dynamicDataPage ?? {}),
  }
  const [dataType, setDataType] = useState<DataType | undefined>(undefined)
  const [dataEntries, setDataEntries] = useState<DynamicDataEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DynamicDataEntry | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<DynamicDataEntry | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null) // State to hold current user

  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user) // Set the current user

      if (user) {
        const { data: userProfile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
        if (error) {
          console.error("Error fetching current user profile type:", error)
        } else if (userProfile) {
          setIsAdmin(userProfile.type === "Administrator")
          setIsManager(userProfile.type === "Manager")
        }
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const dictResponse = await fetch(`/api/dictionaries/data-types/${lang}`)
        if (!dictResponse.ok) throw new Error("Failed to fetch data types dictionary")
        const dictData = await dictResponse.json()
        setDict(dictData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: "Error",
          description: err.message || "Failed to load dictionary.",
          variant: "destructive",
        })
        // Fallback dictionary if fetch fails
        setDict({
          dynamicDataPage: {
            title: "Data Entries for {dataTypeName}",
            loadingEntries: "Loading data entries...",
            failedToFetchEntries: "Failed to fetch data entries.",
            entrySaved: "Data entry saved successfully.",
            entryDeleted: "Data entry deleted successfully.",
            failedToSaveEntry: "Failed to save data entry.",
            failedToDeleteEntry: "Failed to delete data entry.",
            addEntry: "Add New Entry",
            noEntriesFound: "No entries found for this data type.",
          },
          dynamicDataEntryForm: {
            editorTitle: "Edit Data Entry",
            editorDescription: "Enter data for this type.",
            saveButton: "Save Entry",
            cancelButton: "Cancel",
            invalidInput: "Invalid Input",
            requiredField: "This field is required.",
            invalidNumber: "Please enter a valid number.",
            invalidJson: "Invalid JSON format.",
            invalidDate: "Invalid date format.",
            fieldLabel: "Field",
          },
          common: {
            actions: "Actions",
            edit: "Edit",
            delete: "Delete",
            confirmDeletion: "Confirm Deletion",
            confirmDeletionDescription: "Are you sure you want to delete this entry? This action cannot be undone.",
            deleteButton: "Delete",
            cancel: "Cancel",
            loading: "Loading...",
            error: "Error",
            success: "Success",
          },
        })
      }
    }
    loadDictionary()
  }, [lang, toast])

  const fetchData = useCallback(async () => {
    if (!dict) return
    setLoading(true)
    try {
      // Fetch the data type schema
      const dataTypeResponse = await fetch(`/api/data-types/${dataTypeId}`)
      if (!dataTypeResponse.ok) throw new Error("Failed to fetch data type schema")
      const dataTypeData: DataType = await dataTypeResponse.json()
      setDataType(dataTypeData)

      // Fetch the actual data entries for this data type
      const entriesResponse = await fetch(`/api/dynamic-data-entries?dataTypeId=${dataTypeId}`)
      if (!entriesResponse.ok) throw new Error("Failed to fetch data entries")
      const entriesData: DynamicDataEntry[] = await entriesResponse.json()
      setDataEntries(entriesData)
    } catch (err: any) {
      console.error(err)
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dynamicDict.failedToFetchEntries || "Failed to load data.",
        variant: "destructive",
      })
      // Redirect back to data types list if schema or entries fail to load
      router.push(`/${lang}/data-types`)
    } finally {
      setLoading(false)
    }
  }, [dataTypeId, lang, router, toast, dict, dynamicDict.failedToFetchEntries])

  useEffect(() => {
    if (dict) {
      fetchData()
    }
  }, [fetchData, dict])

  const handleSaveEntry = async (entryData: DynamicDataEntry) => {
    try {
      let response: Response
      if (entryData.id) {
        // Existing entry: PUT request
        response = await fetch(`/api/dynamic-data-entries/${entryData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: entryData.data }), // Only send 'data' for update
        })
      } else {
        // New entry: POST request
        response = await fetch("/api/dynamic-data-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data_type_id: dataTypeId,
            organization_id: organizationId,
            data: entryData.data,
          }),
        })
      }

      if (!response.ok) {
        let message = dynamicDict.failedToSaveEntry || "Failed to save data entry."
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
        description: dynamicDict.entrySaved || "Data entry saved successfully.",
      })
      fetchData() // Re-fetch data to update the list
      setIsFormOpen(false)
      setEditingEntry(undefined)
    } catch (err: any) {
      toast({
        title: dict?.common.error || "Error",
        description: err.message || "Failed to save data entry.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return
    try {
      const response = await fetch(`/api/dynamic-data-entries/${entryToDelete.id}`, { method: "DELETE" })

      if (!response.ok) {
        let message = dynamicDict.failedToDeleteEntry || "Failed to delete data entry."
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
        description: dynamicDict.entryDeleted || "Data entry deleted successfully.",
      })
      fetchData() // Re-fetch data to update the list
      setIsDeleteDialogOpen(false)
      setEntryToDelete(undefined)
    } catch (err: any) {
      toast({
        title: dict?.common.error || "Error",
        description: err.message || "Failed to delete data entry.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openEditForm = (entry: DynamicDataEntry) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  const openDeleteConfirm = (entry: DynamicDataEntry) => {
    setEntryToDelete(entry)
    setIsDeleteDialogOpen(true)
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingEntry(undefined)
  }

  if (loading || !dict || !dataType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>{dict?.common.loading || "Loading..."}</p>
      </div>
    )
  }

  // Determine if actions are allowed (admins/managers)
  const canManageData = isAdmin || isManager
  // Determine if adding new entries is allowed (any authenticated user)
  const canAddData = !!currentUser // True if currentUser is not null

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {dynamicDict.title.replace("{dataTypeName}", dataType.name)}
          </CardTitle>
          {canAddData && ( // Changed condition here
            <Button
              onClick={() => {
                setEditingEntry(undefined)
                setIsFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {dynamicDict.addEntry}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {dataEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">{dynamicDict.noEntriesFound}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {dataType.fields.map((field) => (
                    <TableHead key={field.name}>{field.name}</TableHead>
                  ))}
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  {canManageData && <TableHead className="text-right">{dict.common.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    {dataType.fields.map((field) => (
                      <TableCell key={field.name}>
                        {field.type === "boolean"
                          ? String(entry.data[field.name])
                          : field.type === "json"
                            ? JSON.stringify(entry.data[field.name])
                            : entry.data[field.name]?.toString() || "N/A"}
                      </TableCell>
                    ))}
                    <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(entry.updated_at).toLocaleString()}</TableCell>
                    {canManageData && (
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
                            <DropdownMenuItem onClick={() => openEditForm(entry)}>{dict.common.edit}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteConfirm(entry)}>
                              {dict.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <DynamicDataEntryForm
          dataType={dataType}
          initialData={editingEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelForm}
          dict={dict.dynamicDataEntryForm}
        />
      )}

      {entryToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteEntry}
          itemType="data entry" // Hardcoded for now, can be dynamic
          itemName={entryToDelete.id} // Use ID or a representative field
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
