"use client"

import React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DynamicDataEntryForm } from "@/components/dynamic-data-entry-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { DataType, DynamicDataEntry } from "@/types/data"

export default async function EditDynamicDataEntryPage({
  params,
}: {
  params: Promise<{ lang: "en" | "es"; organizationId: string; dataTypeId: string; dataTypeNameSlug: string; entryId: string }>
}) {
  const { lang, organizationId, dataTypeId, dataTypeNameSlug, entryId } = await params
  const router = useRouter()
  const { toast } = useToast()
  
  const [dict, setDict] = useState<any>(null)
  const [dataType, setDataType] = useState<DataType | undefined>(undefined)
  const [entry, setEntry] = useState<DynamicDataEntry | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  
  // Batch user-related state to reduce re-renders
  const [userState, setUserState] = useState({
    currentUser: null as User | null,
    isAdmin: false,
    isManager: false,
  })

  // Destructure user state for easier access
  const { currentUser, isAdmin, isManager } = userState

  const supabase = useMemo(() => createBrowserClient(), [])

  // Load dictionary
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
          dynamicDataEntryForm: {
            formTitle: "Edit Entry",
            formDescription: "Edit the details for this data entry.",
            saveButton: "Save Entry",
            cancelButton: "Cancel",
          },
          common: {
            actions: "Actions",
            edit: "Edit",
            delete: "Delete",
            loading: "Loading...",
            error: "Error",
            success: "Success",
          },
        })
      }
    }
    loadDictionary()
  }, [lang, toast])

  // Load user profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
        if (error) {
          console.error("Error fetching current user profile type:", error)
          setUserState({
            currentUser: user,
            isAdmin: false,
            isManager: false,
          })
        } else if (userProfile) {
          setUserState({
            currentUser: user,
            isAdmin: userProfile.type === "Administrator",
            isManager: userProfile.type === "Manager",
          })
        }
      } else {
        setUserState({
          currentUser: null,
          isAdmin: false,
          isManager: false,
        })
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  // Load data type and entry
  useEffect(() => {
    const fetchData = async () => {
      if (!dict) return
      setLoading(true)
      
      try {
        // Fetch the data type schema
        const dataTypeResponse = await fetch(`/api/data-types/${dataTypeId}`)
        if (!dataTypeResponse.ok) throw new Error("Failed to fetch data type schema")
        const dataTypeData: DataType = await dataTypeResponse.json()
        setDataType(dataTypeData)

        // Fetch the specific entry to edit
        const entryResponse = await fetch(`/api/dynamic-data-entries/${entryId}`)
        if (!entryResponse.ok) throw new Error("Failed to fetch entry")
        const entryData: DynamicDataEntry = await entryResponse.json()
        setEntry(entryData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: dict?.common?.error || "Error",
          description: err.message || "Failed to load data.",
          variant: "destructive",
        })
        // Redirect back to data types list on error
        router.push(`/${lang}/data-types/${organizationId}/${dataTypeId}/${dataTypeNameSlug}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dict, dataTypeId, entryId, lang, organizationId, dataTypeNameSlug, router, toast])

  const handleSave = async (entryData: DynamicDataEntry) => {
    try {
      const payload = { data: entryData.data ?? {} } // Always PUT for editing

      const response = await fetch(`/api/dynamic-data-entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let message = `HTTP ${response.status} ${response.statusText}`
        const ct = response.headers.get("content-type") ?? ""
        if (ct.includes("application/json")) {
          try {
            const j = await response.clone().json()
            if (j?.error) message = String(j.error)
          } catch {
            /* swallow JSON parse errors */
          }
        } else {
          const txt = await response.clone().text()
          if (txt.trim()) message = txt.trim()
        }
        throw new Error(message)
      }

      toast({
        title: dict?.common?.success ?? "Success",
        description: "Entry updated successfully.",
      })
      
      // Redirect back to the list
      router.push(`/${lang}/data-types/${organizationId}/${dataTypeId}/${dataTypeNameSlug}`)
    } catch (err: any) {
      toast({
        title: dict?.common?.error ?? "Error",
        description: err?.message ?? "Failed to update entry.",
        variant: "destructive",
      })
      console.error("handleSave error:", err)
    }
  }

  const handleCancel = () => {
    router.push(`/${lang}/data-types/${organizationId}/${dataTypeId}/${dataTypeNameSlug}`)
  }

  // Create a computed dictionary with the data type name
  const computedDict = useMemo(() => {
    if (!dict || !dataType) return dict
    
    return {
      ...dict,
      dynamicDataEntryForm: {
        ...dict.dynamicDataEntryForm,
        formTitle: `Edit ${dataType.name}`,
        formTitleEdit: `Edit ${dataType.name}`,
      }
    }
  }, [dict, dataType])

  if (loading || !dict || !dataType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>{dict?.common?.loading || "Loading..."}</p>
      </div>
    )
  }

  // Check permissions - for editing, user should be authenticated
  const canEditData = !!currentUser

  if (!canEditData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>You don't have permission to edit this entry.</p>
        <Button onClick={handleCancel} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {dataType.name} List
        </Button>
      </div>

      <DynamicDataEntryForm
        dataType={dataType}
        entry={entry}
        onSave={handleSave}
        onCancel={handleCancel}
        dict={computedDict?.dynamicDataEntryForm}
      />
    </div>
  )
}
