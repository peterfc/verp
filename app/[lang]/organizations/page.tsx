"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrganizationForm } from "@/components/organization-form" // Renamed import
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

interface Profile {
  id: string
  name: string
  email: string
}

interface Organization {
  id: string
  name: string
  contact: string
  industry: string
  profiles: Profile[]
}

export default function OrganizationsPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null) // State to hold dictionary
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
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
        }
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch(`/api/dictionaries/organizations/${lang}`) // Updated API route
        if (!response.ok) {
          throw new Error("Failed to fetch organizations dictionary")
        }
        const data = await response.json()
        setDict(data)
      } catch (err) {
        console.error(err)
        // Fallback to a minimal English dictionary if fetch fails
        setDict({
          organizationsPage: {
            // Updated key
            title: "Organizations", // Updated value
            loadingOrganizations: "Loading organizations...", // Updated value
            failedToFetchOrganizations: "Failed to fetch organizations.", // Updated value
            organizationSaved: "Organization saved successfully.", // Updated value
            organizationDeleted: "Organization deleted successfully.", // Updated value
            failedToSaveOrganization: "Failed to save organization.", // Updated value
            failedToDeleteOrganization: "Failed to delete organization.", // Updated value
            contact: "Contact",
            industry: "Industry",
            associatedProfiles: "Associated Profiles",
          },
          organizationForm: {
            // Updated key
            editTitle: "Edit Organization", // Updated value
            addTitle: "Add Organization", // Updated value
            editDescription: "Make changes to the organization here.", // Updated value
            addDescription: "Add a new organization to your list.", // Updated value
            contactLabel: "Contact",
            industryLabel: "Industry",
            profilesLabel: "Profiles",
            errorFetchingProfiles: "Error fetching profiles",
            failedToLoadProfiles: "Failed to load profiles for selection.",
          },
          multiSelectProfiles: {
            selectProfilesPlaceholder: "Select profiles...",
            searchProfilesPlaceholder: "Search profiles...",
            noProfilesFound: "No profiles found.",
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

  const fetchOrganizations = useCallback(async () => {
    if (!dict) return // Wait for dictionary to load
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/organizations") // Updated API route
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: Organization[] = await response.json()
      setOrganizations(data)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToFetchOrganizations || "Failed to fetch organizations.") // Updated key
      toast({
        title: dict?.common.error || "Error",
        description:
          err.message || dict?.organizationsPage.failedToFetchOrganizations || "Failed to fetch organizations.", // Updated key
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dict, toast])

  useEffect(() => {
    if (dict) {
      fetchOrganizations()
    }
  }, [fetchOrganizations, dict])

  const handleSaveOrganization = async (organizationData: {
    // Updated type
    id?: string
    name: string
    contact: string
    industry: string
    profile_ids: string[]
  }) => {
    setError(null)
    try {
      let response: Response
      if (organizationData.id) {
        response = await fetch(`/api/organizations/${organizationData.id}`, {
          // Updated API route
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(organizationData),
        })
      } else {
        response = await fetch("/api/organizations", {
          // Updated API route
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(organizationData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.",
        ) // Updated key
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.organizationsPage.organizationSaved || "Organization saved successfully.", // Updated key
      })
      fetchOrganizations()
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.") // Updated key
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.", // Updated key
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleDeleteOrganization = async () => {
    // Updated function name
    if (!organizationToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/organizations/${organizationToDelete.id}`, {
        // Updated API route
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.",
        ) // Updated key
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.organizationsPage.organizationDeleted || "Organization deleted successfully.", // Updated key
      })
      fetchOrganizations()
      setIsDeleteDialogOpen(false)
      setOrganizationToDelete(undefined)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.") // Updated key
      toast({
        title: dict?.common.error || "Error",
        description:
          err.message || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.", // Updated key
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openEditForm = (organization: Organization) => {
    // Updated type
    setEditingOrganization(organization)
    setIsFormOpen(true)
  }

  const openDeleteConfirm = (organization: Organization) => {
    // Updated type
    setOrganizationToDelete(organization)
    setIsDeleteDialogOpen(true)
  }

  if (!dict) return null // Don't render until dictionary is loaded

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.organizationsPage.title}</CardTitle>
          {isAdmin && ( // Only show if the user is an admin
            <Button
              onClick={() => {
                setEditingOrganization(undefined)
                setIsFormOpen(true)
              }}
            >
              {dict.common.add.replace("{itemType}", dict.organizationsPage.title.toLowerCase())}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">{dict.organizationsPage.loadingOrganizations}</div> // Updated key
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {dict.common.error}: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.organizationsPage.contact}</TableHead> {/* Updated key */}
                  <TableHead>{dict.organizationsPage.industry}</TableHead> {/* Updated key */}
                  <TableHead>{dict.organizationsPage.associatedProfiles}</TableHead> {/* Updated key */}
                  <TableHead className="text-right">{dict.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {dict.common.noDataFound.replace("{itemType}", dict.organizationsPage.title.toLowerCase())}{" "}
                      {/* Updated key */}
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map(
                    (
                      organization, // Updated variable name
                    ) => (
                      <TableRow key={organization.id}>
                        {[
                          <TableCell key="name" className="font-medium">
                            {organization.name}
                          </TableCell>,
                          <TableCell key="contact">{organization.contact}</TableCell>,
                          <TableCell key="industry">{organization.industry}</TableCell>,
                          <TableCell key="profiles">
                            {
                              /* Safely collect profile names, ignoring null / undefined entries */
                              (organization.profiles ?? [])
                                .filter((pr) => pr && pr.name)
                                .map((pr) => pr!.name)
                                .join(", ") || "None"
                            }
                          </TableCell>,
                          <TableCell key="actions" className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">{dict.common.actions}</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditForm(organization)}>
                                  {dict.common.edit}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isAdmin && ( // Conditionally render delete option
                                  <DropdownMenuItem onClick={() => openDeleteConfirm(organization)}>
                                    {dict.common.delete}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>,
                        ]}
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OrganizationForm // Renamed component
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        organization={editingOrganization} // Updated prop name
        onSave={handleSaveOrganization} // Updated function name
        dict={{
          editTitle: dict.organizationForm.editTitle, // Updated key
          addTitle: dict.organizationForm.addTitle, // Updated key
          editDescription: dict.organizationForm.editDescription, // Updated key
          addDescription: dict.organizationForm.addDescription, // Updated key
          nameLabel: dict.common.name,
          contactLabel: dict.organizationForm.contactLabel, // Updated key
          industryLabel: dict.organizationForm.industryLabel, // Updated key
          profilesLabel: dict.organizationForm.profilesLabel, // Updated key
          saveChangesButton: dict.common.saveChanges,
          addOrganizationButton: dict.common.add.replace("{itemType}", dict.organizationsPage.title.toLowerCase()), // Updated key
          errorFetchingProfiles: dict.organizationForm.errorFetchingProfiles, // Updated key
          failedToLoadProfiles: dict.organizationForm.failedToLoadProfiles, // Updated key
          selectProfilesPlaceholder: dict.multiSelectProfiles.selectProfilesPlaceholder,
          searchProfilesPlaceholder: dict.multiSelectProfiles.searchProfilesPlaceholder,
          noProfilesFound: dict.multiSelectProfiles.noProfilesFound,
        }}
      />

      {organizationToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteOrganization} // Updated function name
          itemType={dict.organizationsPage.title.toLowerCase()} // Updated key
          itemName={organizationToDelete.name}
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
