"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProfileForm } from "@/components/profile-form"
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
// Removed: import { getDictionary } from "../dictionaries"

interface Profile {
  id: string
  name: string
  email: string
}

export default function ProfilesPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<Profile | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null) // State to hold dictionary

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch(`/api/dictionaries/profiles/${lang}`)
        if (!response.ok) {
          throw new Error("Failed to fetch profiles dictionary")
        }
        const data = await response.json()
        setDict(data)
      } catch (err) {
        console.error(err)
        // Fallback to a minimal English dictionary if fetch fails
        setDict({
          profilesPage: {
            title: "Profiles",
            loadingProfiles: "Loading profiles...",
            failedToFetchProfiles: "Failed to fetch profiles.",
            actionNotAllowed: "Action Not Allowed",
            newProfilesSignup: "New profiles are created via the signup process.",
            profileSaved: "Profile saved successfully.",
            profileDeleted: "Profile deleted successfully.",
            failedToSaveProfile: "Failed to save profile.",
            failedToDeleteProfile: "Failed to delete profile.",
          },
          profileForm: {
            editTitle: "Edit Profile",
            addTitle: "Add Profile",
            editDescription: "Make changes to the profile here.",
            addDescription: "Add a new profile to your list.",
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

  const fetchProfiles = useCallback(async () => {
    if (!dict) return // Wait for dictionary to load
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/profiles")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: Profile[] = await response.json()
      setProfiles(data)
    } catch (err: any) {
      setError(err.message || dict?.profilesPage.failedToFetchProfiles || "Failed to fetch profiles.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.profilesPage.failedToFetchProfiles || "Failed to fetch profiles.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dict, toast])

  useEffect(() => {
    if (dict) {
      fetchProfiles()
    }
  }, [fetchProfiles, dict])

  const handleSaveProfile = async (profile: { id?: string; name: string; email: string }) => {
    setError(null)
    try {
      let response: Response
      if (profile.id) {
        response = await fetch(`/api/profiles/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: profile.name, email: profile.email }),
        })
      } else {
        toast({
          title: dict?.profilesPage.actionNotAllowed || "Action Not Allowed",
          description: dict?.profilesPage.newProfilesSignup || "New profiles are created via the signup process.",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || dict?.profilesPage.failedToSaveProfile || "Failed to save profile.")
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.profilesPage.profileSaved || "Profile saved successfully.",
      })
      fetchProfiles()
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || dict?.profilesPage.failedToSaveProfile || "Failed to save profile.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.profilesPage.failedToSaveProfile || "Failed to save profile.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/profiles/${profileToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || dict?.profilesPage.failedToDeleteProfile || "Failed to delete profile.")
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.profilesPage.profileDeleted || "Profile deleted successfully.",
      })
      fetchProfiles()
      setIsDeleteDialogOpen(false)
      setProfileToDelete(undefined)
    } catch (err: any) {
      setError(err.message || dict?.profilesPage.failedToDeleteProfile || "Failed to delete profile.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.profilesPage.failedToDeleteProfile || "Failed to delete profile.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openEditForm = (profile: Profile) => {
    setEditingProfile(profile)
    setIsFormOpen(true)
  }

  const openDeleteConfirm = (profile: Profile) => {
    setProfileToDelete(profile)
    setIsDeleteDialogOpen(true)
  }

  if (!dict) return null // Don't render until dictionary is loaded

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.profilesPage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">{dict.profilesPage.loadingProfiles}</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {dict.common.error}: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.common.email}</TableHead>
                  <TableHead className="text-right">{dict.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      {dict.common.noDataFound.replace("{itemType}", dict.profilesPage.title.toLowerCase())}
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>{profile.email}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditForm(profile)}>
                              {dict.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteConfirm(profile)}>
                              {dict.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProfileForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        profile={editingProfile}
        onSave={handleSaveProfile}
        dict={{
          editTitle: dict.profileForm.editTitle,
          addTitle: dict.profileForm.addTitle,
          editDescription: dict.profileForm.editDescription,
          addDescription: dict.profileForm.addDescription,
          nameLabel: dict.common.name,
          emailLabel: dict.common.email,
          saveChangesButton: dict.common.saveChanges,
          addProfileButton: dict.common.add.replace("{itemType}", dict.profilesPage.title.toLowerCase()),
        }}
      />

      {profileToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteProfile}
          itemType={dict.profilesPage.title.toLowerCase()}
          itemName={profileToDelete.name}
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
