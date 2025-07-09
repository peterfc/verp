"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProfileForm } from "@/components/profile-form" // Changed import
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

interface Profile {
  id: string
  name: string
  email: string
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<Profile | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProfiles = useCallback(async () => {
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
      setError(err.message || "Failed to fetch profiles.")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch profiles.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

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
        // For new profiles, they are created via Supabase Auth signup,
        // and then a profile entry is automatically created via a trigger or in the signup handler.
        // This form is primarily for editing existing profiles.
        // If you want to allow admin to add profiles, you'd need an admin API route.
        // For now, we'll assume new profiles are created via the login/signup page.
        toast({
          title: "Action Not Allowed",
          description: "New profiles are created via the signup process.",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save profile.")
      }
      toast({
        title: "Success",
        description: "Profile saved successfully.",
      })
      fetchProfiles() // Re-fetch profiles to update the list
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to save profile.")
      toast({
        title: "Error",
        description: err.message || "Failed to save profile.",
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
        throw new Error(errorData.error || "Failed to delete profile.")
      }
      toast({
        title: "Success",
        description: "Profile deleted successfully.",
      })
      fetchProfiles() // Re-fetch profiles to update the list
      setIsDeleteDialogOpen(false)
      setProfileToDelete(undefined)
    } catch (err: any) {
      setError(err.message || "Failed to delete profile.")
      toast({
        title: "Error",
        description: err.message || "Failed to delete profile.",
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Profiles</CardTitle>
          {/* Removed "Add Profile" button as profiles are created via signup */}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading profiles...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No profiles found.
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
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditForm(profile)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteConfirm(profile)}>Delete</DropdownMenuItem>
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
      />

      {profileToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteProfile}
          itemType="profile"
          itemName={profileToDelete.name}
        />
      )}
    </div>
  )
}
