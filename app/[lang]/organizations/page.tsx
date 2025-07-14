"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrganizationForm } from "@/components/organization-form"
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
import type { Organization } from "@/types/data" // Import Organization and Profile from types/data

export default function OrganizationsPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
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
        const response = await fetch(`/api/dictionaries/organizations/${lang}`)
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
            title: "Organizations",
            loadingOrganizations: "Loading organizations...",
            failedToFetchOrganizations: "Failed to fetch organizations.",
            organizationSaved: "Organization saved successfully.",
            organizationDeleted: "Organization deleted successfully.",
            failedToSaveOrganization: "Failed to save organization.",
            failedToDeleteOrganization: "Failed to delete organization.",
            contact: "Contact",
            industry: "Industry",
            associatedProfiles: "Associated Profiles",
          },
          organizationForm: {
            editTitle: "Edit Organization",
            addTitle: "Add Organization",
            editDescription: "Make changes to the organization here.",
            addDescription: "Add a new organization to your list.",
            nameLabel: "Name",
            namePlaceholder: "Enter organization name", // Added
            contactLabel: "Contact",
            contactPlaceholder: "Enter contact information", // Added
            industryLabel: "Industry",
            industryPlaceholder: "Enter industry", // Added
            profilesLabel: "Profiles",
            errorFetchingProfiles: "Error fetching profiles",
            failedToLoadProfiles: "Failed to load profiles for selection.",
            saveChangesButton: "Save changes",
            addOrganizationButton: "Add Organization",
            saveButton: "Save", // Added
            savingButton: "Saving...", // Added
            cancelButton: "Cancel", // Added
            deleteButton: "Delete", // Added
            deletingButton: "Deleting...", // Added
            confirmDeleteTitle: "Confirm Deletion", // Added
            confirmDeleteDescription:
              "Are you sure you want to delete this organization? This action cannot be undone.", // Added
            successToastTitle: "Success!", // Added
            successToastDescription: "Organization saved successfully.", // Added
            errorToastTitle: "Error", // Added
            errorToastDescription: "Failed to save organization.", // Added
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
    if (!dict) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/organizations")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // Now, directly cast to Organization[] as the interface in types/data.ts is complete
      const data: Organization[] = await response.json()
      setOrganizations(data)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToFetchOrganizations || "Failed to fetch organizations.")
      toast({
        title: dict?.common.error || "Error",
        description:
          err.message || dict?.organizationsPage.failedToFetchOrganizations || "Failed to fetch organizations.",
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

  const handleSaveOrganization = async (organizationData: Organization) => {
    setError(null)
    try {
      let response: Response
      if (organizationData.id) {
        response = await fetch(`/api/organizations/${organizationData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(organizationData),
        })
      } else {
        response = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(organizationData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.",
        )
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.organizationsPage.organizationSaved || "Organization saved successfully.",
      })
      fetchOrganizations()
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.organizationsPage.failedToSaveOrganization || "Failed to save organization.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/organizations/${organizationToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.",
        )
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.organizationsPage.organizationDeleted || "Organization deleted successfully.",
      })
      fetchOrganizations()
      setIsDeleteDialogOpen(false)
      setOrganizationToDelete(undefined)
    } catch (err: any) {
      setError(err.message || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.")
      toast({
        title: dict?.common.error || "Error",
        description:
          err.message || dict?.organizationsPage.failedToDeleteOrganization || "Failed to delete organization.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openEditForm = (organization: Organization) => {
    setEditingOrganization(organization)
    setIsFormOpen(true)
  }

  const openDeleteConfirm = (organization: Organization) => {
    setOrganizationToDelete(organization)
    setIsDeleteDialogOpen(true)
  }

  if (!dict) return null

  // Determine if actions column should be visible
  const showActionsColumn = isAdmin || isManager

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.organizationsPage.title}</CardTitle>
          {isAdmin && (
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
            <div className="text-center py-4">{dict.organizationsPage.loadingOrganizations}</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {dict.common.error}: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.organizationsPage.contact}</TableHead>
                  <TableHead>{dict.organizationsPage.industry}</TableHead>
                  <TableHead>{dict.organizationsPage.associatedProfiles}</TableHead>
                  {showActionsColumn && <TableHead className="text-right">{dict.common.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActionsColumn ? 5 : 4} className="text-center py-4">
                      {dict.common.noDataFound.replace("{itemType}", dict.organizationsPage.title.toLowerCase())}
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell key="name" className="font-medium">
                        {organization.name}
                      </TableCell>
                      <TableCell key="contact">{organization.contact}</TableCell>
                      <TableCell key="industry">{organization.industry}</TableCell>
                      <TableCell key="profiles">
                        {(organization.profiles ?? [])
                          .filter((pr) => pr && pr.name)
                          .map((pr) => pr!.name)
                          .join(", ") || "None"}
                      </TableCell>
                      {showActionsColumn && (
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
                              {(isAdmin || isManager) && (
                                <DropdownMenuItem onClick={() => openEditForm(organization)}>
                                  {dict.common.edit}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => openDeleteConfirm(organization)}>
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

      <OrganizationForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        organization={editingOrganization}
        onSave={handleSaveOrganization}
        dict={{
          editTitle: dict.organizationForm.editTitle,
          addTitle: dict.organizationForm.addTitle,
          editDescription: dict.organizationForm.editDescription,
          addDescription: dict.organizationForm.addDescription,
          nameLabel: dict.organizationForm.nameLabel,
          namePlaceholder: dict.organizationForm.namePlaceholder, // Added
          contactLabel: dict.organizationForm.contactLabel,
          contactPlaceholder: dict.organizationForm.contactPlaceholder, // Added
          industryLabel: dict.organizationForm.industryLabel,
          industryPlaceholder: dict.organizationForm.industryPlaceholder, // Added
          profilesLabel: dict.organizationForm.profilesLabel,
          saveChangesButton: dict.organizationForm.saveChangesButton,
          addOrganizationButton: dict.organizationForm.addOrganizationButton,
          errorFetchingProfiles: dict.organizationForm.errorFetchingProfiles,
          failedToLoadProfiles: dict.organizationForm.failedToLoadProfiles,
          selectProfilesPlaceholder: dict.multiSelectProfiles.selectProfilesPlaceholder,
          searchProfilesPlaceholder: dict.multiSelectProfiles.searchProfilesPlaceholder,
          noProfilesFound: dict.multiSelectProfiles.noProfilesFound,
          saveButton: dict.organizationForm.saveButton, // Added
          savingButton: dict.organizationForm.savingButton, // Added
          cancelButton: dict.organizationForm.cancelButton, // Added
          deleteButton: dict.organizationForm.deleteButton, // Added
          deletingButton: dict.organizationForm.deletingButton, // Added
          confirmDeleteTitle: dict.organizationForm.confirmDeleteTitle, // Added
          confirmDeleteDescription: dict.organizationForm.confirmDeleteDescription, // Added
          successToastTitle: dict.organizationForm.successToastTitle, // Added
          successToastDescription: dict.organizationForm.successToastDescription, // Added
          errorToastTitle: dict.organizationForm.errorToastTitle, // Added
          errorToastDescription: dict.organizationForm.errorToastDescription, // Added
        }}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      {organizationToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteOrganization}
          itemType={dict.organizationsPage.title.toLowerCase()}
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
