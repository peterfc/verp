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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelectOrganizations } from "./multi-select-organizations"
import { useToast } from "@/hooks/use-toast"

interface Organization {
  id: string
  name: string
}

interface ProfileFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  profile?: { id: string; name: string; email: string; type: string }
  onSave: (profile: { id?: string; name: string; email: string; type: string; organization_ids?: string[] }) => void
  dict: {
    editTitle: string
    addTitle: string
    editDescription: string
    addDescription: string
    nameLabel: string
    emailLabel: string
    typeLabel: string
    organizationsLabel: string
    typeOptions: {
      administrator: string
      manager: string
      user: string
    }
    saveChangesButton: string
    addProfileButton: string
  }
  isAdmin: boolean
  isManager: boolean
}

export function ProfileForm({ isOpen, onOpenChange, profile, onSave, dict, isAdmin, isManager }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || "")
  const [email, setEmail] = useState(profile?.email || "")
  const [type, setType] = useState(profile?.type || "User")
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch all organizations when the dialog opens (only for new profiles)
  useEffect(() => {
    if (isOpen && !profile) {
      const fetchAllOrganizations = async () => {
        try {
          const response = await fetch("/api/organizations")
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data: Organization[] = await response.json()
          setAllOrganizations(data)
        } catch (err: any) {
          toast({
            title: "Error fetching organizations",
            description: err.message || "Failed to load organizations for selection.",
            variant: "destructive",
          })
          console.error(err)
        }
      }
      fetchAllOrganizations()
    }
  }, [isOpen, profile, toast])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
      setType(profile.type)
      setSelectedOrganizationIds([]) // For editing, we don't change organizations
    } else {
      setName("")
      setEmail("")
      setType("User")
      setSelectedOrganizationIds([])
    }
  }, [profile, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const profileData = { 
      id: profile?.id, 
      name, 
      email, 
      type,
      ...((!profile && selectedOrganizationIds.length > 0) && { organization_ids: selectedOrganizationIds })
    }
    onSave(profileData)
    onOpenChange(false)
  }

  // Determine if the type dropdown should be disabled
  const isTypeSelectDisabled = !isAdmin && (!isManager || (profile && profile.type === "Administrator"))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{profile ? dict.editTitle : dict.addTitle}</DialogTitle>
          <DialogDescription>{profile ? dict.editDescription : dict.addDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {dict.nameLabel}
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              {dict.emailLabel}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              {dict.typeLabel}
            </Label>
            <Select value={type} onValueChange={setType} disabled={isTypeSelectDisabled}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={dict.typeLabel} />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="Administrator">{dict.typeOptions.administrator}</SelectItem>}
                <SelectItem value="Manager">{dict.typeOptions.manager}</SelectItem>
                <SelectItem value="User">{dict.typeOptions.user}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Organization selection - only show for new profiles */}
          {!profile && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organizations" className="text-right">
                {dict.organizationsLabel}
              </Label>
              <div className="col-span-3">
                <MultiSelectOrganizations
                  organizations={allOrganizations}
                  selectedOrganizationIds={selectedOrganizationIds}
                  onSelectionChange={setSelectedOrganizationIds}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit">{profile ? dict.saveChangesButton : dict.addProfileButton}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
