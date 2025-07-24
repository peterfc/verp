"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileEditor } from "@/components/profile-editor" // Import the new ProfileEditor
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string
  email: string
  type: string
}

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ lang: "en" | "es"; id: string }>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [lang, setLang] = useState<"en" | "es">("en")
  const [id, setId] = useState<string>("")
  const [dict, setDict] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const supabase = createBrowserClient()

  // Handle params Promise in useEffect
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setLang(resolvedParams.lang)
      setId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

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
    const loadData = async () => {
      if (!lang || !id) return // Don't load until params are resolved
      
      setLoading(true)
      try {
        const dictResponse = await fetch(`/api/dictionaries/profiles/${lang}`)
        if (!dictResponse.ok) throw new Error("Failed to fetch profiles dictionary")
        const dictData = await dictResponse.json()
        setDict(dictData)

        const profileResponse = await fetch(`/api/profiles/${id}`)
        if (!profileResponse.ok) throw new Error("Failed to fetch profile")
        const profileData: Profile = await profileResponse.json()
        setProfile(profileData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: dict?.common.error || "Error",
          description: err.message || "Failed to load profile data.",
          variant: "destructive",
        })
        // Redirect back to profiles list or dashboard if data fails to load
        router.push(`/${lang}/profiles`)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, lang, router, toast, dict?.common.error])

  const handleSave = async (profileData: { id?: string; name: string; email: string; type: string }) => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        let message = dict?.profilesPage.failedToSaveProfile || "Failed to save profile."
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
        description: dict?.profilesPage.profileSaved || "Profile saved successfully.",
      })
      // Redirect based on user role after saving
      if (isAdmin || isManager) {
        router.push(`/${lang}/profiles`) // Back to profiles list for admins/managers
      } else {
        router.push(`/${lang}/`) // Back to dashboard for regular users
      }
    } catch (err: any) {
      toast({
        title: dict?.common.error || "Error",
        description: err.message || "Failed to save profile.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleCancel = () => {
    // Redirect based on user role
    if (isAdmin || isManager) {
      router.push(`/${lang}/profiles`) // Back to profiles list for admins/managers
    } else {
      router.push(`/${lang}/`) // Back to dashboard for regular users
    }
  }

  if (loading || !dict) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>{dict?.common.loading || "Loading..."}</p>
      </div>
    )
  }

  // Ensure the profile exists before rendering the form
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>
          {dict?.common.error || "Error"}: {dict?.profilesPage.failedToFetchProfiles || "Profile not found."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <ProfileEditor
        profile={profile}
        onSave={handleSave}
        onCancel={handleCancel}
        dict={{
          editorTitle: dict.profileForm.editTitle, // Reusing dict keys for editor
          editorDescription: dict.profileForm.editDescription,
          nameLabel: dict.common.name,
          emailLabel: dict.common.email,
          typeLabel: dict.profileForm.typeLabel,
          typeOptions: dict.profileForm.typeOptions,
          saveButton: dict.common.saveChanges,
          cancelButton: dict.common.cancel,
        }}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    </div>
  )
}
