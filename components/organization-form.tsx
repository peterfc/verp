"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MultiSelectProfiles } from "@/components/multi-select-profiles"
import { DeleteDialog } from "@/components/delete-dialog"
import { createClient } from "@/lib/supabase/client"
import type { Organization, Profile } from "@/types/data" // Import Organization and Profile types

interface OrganizationFormProps {
  isOpen: boolean // Added
  onOpenChange: (open: boolean) => void // Added
  onSave: (organizationData: Organization) => Promise<void>
  organization?: Organization
  profiles: Profile[]
  lang: string
  dict: {
    // Properties passed from app/[lang]/organizations/page.tsx
    editTitle: string
    addTitle: string
    editDescription: string
    addDescription: string
    nameLabel: string
    contactLabel: string
    industryLabel: string
    profilesLabel: string
    saveChangesButton: string
    addOrganizationButton: string
    errorFetchingProfiles: string
    failedToLoadProfiles: string
    selectProfilesPlaceholder: string
    searchProfilesPlaceholder: string
    noProfilesFound: string
    // Properties used internally by OrganizationForm
    namePlaceholder: string
    contactPlaceholder: string
    industryPlaceholder: string
    saveButton: string
    savingButton: string
    cancelButton: string
    deleteButton: string
    deletingButton: string
    confirmDeleteTitle: string
    confirmDeleteDescription: string
    successToastTitle: string
    successToastDescription: string
    errorToastTitle: string
    errorToastDescription: string
  }
  isAdmin: boolean
  isManager: boolean
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required." }),
  contact: z.string().optional(),
  industry: z.string().optional(),
  profile_ids: z.array(z.string().uuid()).optional(),
})

export function OrganizationForm({ organization, profiles, lang, dict, isAdmin, isManager }: OrganizationFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
      contact: organization?.contact || "",
      industry: organization?.industry || "",
      profile_ids: organization?.profiles?.map((p) => p.id) || [],
    },
  })

  useEffect(() => {
    form.reset({
      name: organization?.name || "",
      contact: organization?.contact || "",
      industry: organization?.industry || "",
      profile_ids: organization?.profiles?.map((p) => p.id) || [],
    })
  }, [organization, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    try {
      if (organization) {
        // Update existing organization
        const { error } = await supabase
          .from("organizations")
          .update({
            name: values.name,
            contact: values.contact,
            industry: values.industry,
          })
          .eq("id", organization.id)
          .select()
          .single()

        if (error) throw error

        // Update organization_profiles
        // First, get current associations
        const { data: currentAssociations, error: fetchError } = await supabase
          .from("organization_profiles")
          .select("profile_id")
          .eq("organization_id", organization.id)

        if (fetchError) throw fetchError

        const currentProfileIds = currentAssociations?.map((assoc) => assoc.profile_id) || []
        const newProfileIds = values.profile_ids || []

        const profilesToAdd = newProfileIds.filter((id) => !currentProfileIds.includes(id))
        const profilesToRemove = currentProfileIds.filter((id) => !newProfileIds.includes(id))

        if (profilesToAdd.length > 0) {
          const { error: insertError } = await supabase.from("organization_profiles").insert(
            profilesToAdd.map((profile_id) => ({
              organization_id: organization.id,
              profile_id,
            })),
          )
          if (insertError) throw insertError
        }

        if (profilesToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from("organization_profiles")
            .delete()
            .eq("organization_id", organization.id)
            .in("profile_id", profilesToRemove)
          if (deleteError) throw deleteError
        }
      } else {
        // Create new organization
        const { data, error } = await supabase
          .from("organizations")
          .insert({
            name: values.name,
            contact: values.contact,
            industry: values.industry,
          })
          .select()
          .single()

        if (error) throw error

        if (values.profile_ids && values.profile_ids.length > 0) {
          const { error: insertProfilesError } = await supabase.from("organization_profiles").insert(
            values.profile_ids.map((profile_id) => ({
              organization_id: data.id,
              profile_id,
            })),
          )
          if (insertProfilesError) throw insertProfilesError
        }
      }

      toast({
        title: dict.successToastTitle,
        description: dict.successToastDescription,
      })
      router.push(`/${lang}/organizations`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: dict.errorToastTitle,
        description: error.message || dict.errorToastDescription,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      if (organization) {
        // Delete associated organization_profiles first
        const { error: deleteAssociationsError } = await supabase
          .from("organization_profiles")
          .delete()
          .eq("organization_id", organization.id)

        if (deleteAssociationsError) throw deleteAssociationsError

        // Then delete the organization
        const { error } = await supabase.from("organizations").delete().eq("id", organization.id)

        if (error) throw error

        toast({
          title: dict.successToastTitle,
          description: dict.successToastDescription,
        })
        router.push(`/${lang}/organizations`)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: dict.errorToastTitle,
        description: error.message || dict.errorToastDescription,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const isFormDisabled = !isAdmin && !isManager

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{organization ? dict.editTitle : dict.addTitle}</CardTitle>
        <CardDescription>{organization ? dict.editDescription : dict.addDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.nameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict.namePlaceholder} {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.contactLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict.contactPlaceholder} {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.industryLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict.industryPlaceholder} {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.profilesLabel}</FormLabel>
                  <FormControl>
                    <MultiSelectProfiles
                      profiles={profiles}
                      selectedProfileIds={field.value || []}
                      onSelectionChange={field.onChange}
                      dict={{
                        selectProfilesPlaceholder: dict.selectProfilesPlaceholder,
                        searchProfilesPlaceholder: dict.searchProfilesPlaceholder,
                        noProfilesFound: dict.noProfilesFound,
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormDescription>Select profiles to associate with this organization.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving || isDeleting}>
                {dict.cancelButton}
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting || isFormDisabled}>
                {isSaving ? dict.savingButton : dict.saveButton}
              </Button>
              {organization && (isAdmin || isManager) && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? dict.deletingButton : dict.deleteButton}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <DeleteDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        itemType="organization"
        itemName={organization?.name || "this organization"}
        dict={{
          confirmTitle: dict.confirmDeleteTitle,
          confirmDescription: dict.confirmDeleteDescription,
          cancelButton: dict.cancelButton,
          deleteButton: dict.deleteButton,
        }}
      />
    </Card>
  )
}
