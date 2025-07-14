"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MultiSelectProfiles } from "./multi-select-profiles"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  name: string
  email: string
}

interface OrganizationFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  organization?: { id: string; name: string; contact: string; industry: string; profiles?: Profile[] }
  onSave: (organization: {
    id?: string
    name: string
    contact: string
    industry: string
    profile_ids: string[]
  }) => void
  dict: {
    editTitle: string
    addTitle: string
    editDescription: string
    addDescription: string
    nameLabel: string
    contactLabel: string
    industryLabel: string
    profilesLabel: string
    saveChangesButton: string
    addCustomerButton: string
    addOrganizationButton: string
    errorFetchingProfiles: string
    failedToLoadProfiles: string
    selectProfilesPlaceholder: string
    searchProfilesPlaceholder: string
    noProfilesFound: string
  }
  isAdmin: boolean // New prop
  isManager: boolean // New prop
}

export function OrganizationForm({
  isOpen,
  onOpenChange,
  organization,
  onSave,
  dict,
  isAdmin,
  isManager,
}: OrganizationFormProps) {
  const [name, setName] = useState(organization?.name || "")
  const [contact, setContact] = useState(organization?.contact || "")
  const [industry, setIndustry] = useState(organization?.industry || "")
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const { toast } = useToast()

  // Determine if the form should be disabled
  // It's enabled if:
  // 1. Current user is an Admin
  // 2. Current user is a Manager AND an existing organization is being edited
  //    (Managers can only edit existing associated organizations, not create new ones)
  const isFormDisabled = !isAdmin && (!isManager || !organization)

  useEffect(() => {
    if (isOpen) {
      const fetchAllProfiles = async () => {
        try {
          const response = await fetch("/api/profiles")
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data: Profile[] = await response.json()
          setAllProfiles(data)
        } catch (err: any) {
          toast({
            title: dict.errorFetchingProfiles,
            description: err.message || dict.failedToLoadProfiles,
            variant: "destructive",
          })
          console.error(err)
        }
      }
      fetchAllProfiles()
    }
  }, [isOpen, toast, dict])

  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setContact(organization.contact)
      setIndustry(organization.industry)
      setSelectedProfileIds(
        (organization.profiles ?? []).filter((p): p is Profile => Boolean(p && p.id)).map((p) => p.id),
      )
    } else {
      setName("")
      setContact("")
      setIndustry("")
      setSelectedProfileIds([])
    }
  }, [organization, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormDisabled) {
      // Prevent submission if disabled
      toast({
        title: dict.addTitle,
        description: "You do not have permission to edit organizations.",
        variant: "destructive",
      })
      return
    }
    onSave({ id: organization?.id, name, contact, industry, profile_ids: selectedProfileIds })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{organization ? dict.editTitle : dict.addTitle}</DialogTitle>
          <DialogDescription>{organization ? dict.editDescription : dict.addDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {dict.nameLabel}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={isFormDisabled}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              {dict.contactLabel}
            </Label>
            <Input
              id="contact"
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="col-span-3"
              required
              disabled={isFormDisabled}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="industry" className="text-right">
              {dict.industryLabel}
            </Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="col-span-3"
              required
              disabled={isFormDisabled}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profiles" className="text-right">
              {dict.profilesLabel}
            </Label>
            <div className="col-span-3">
              <MultiSelectProfiles
                profiles={allProfiles}
                selectedProfileIds={selectedProfileIds}
                onSelectionChange={setSelectedProfileIds}
                dict={{
                  selectProfilesPlaceholder: dict.selectProfilesPlaceholder,
                  searchProfilesPlaceholder: dict.searchProfilesPlaceholder,
                  noProfilesFound: dict.noProfilesFound,
                }}
                // Disable MultiSelectProfiles if the form is disabled
                disabled={isFormDisabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isFormDisabled}>
              {organization ? dict.saveChangesButton : dict.addOrganizationButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
