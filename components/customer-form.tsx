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

interface CustomerFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  customer?: { id: string; name: string; contact: string; industry: string; profiles?: Profile[] }
  onSave: (customer: { id?: string; name: string; contact: string; industry: string; profile_ids: string[] }) => void
  dict: {
    // Add dictionary prop
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
    errorFetchingProfiles: string
    failedToLoadProfiles: string
    selectProfilesPlaceholder: string
    searchProfilesPlaceholder: string
    noProfilesFound: string
  }
}

export function CustomerForm({ isOpen, onOpenChange, customer, onSave, dict }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "")
  const [contact, setContact] = useState(customer?.contact || "")
  const [industry, setIndustry] = useState(customer?.industry || "")
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const { toast } = useToast()

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
    if (customer) {
      setName(customer.name)
      setContact(customer.contact)
      setIndustry(customer.industry)
      setSelectedProfileIds(customer.profiles?.map((p) => p.id) || [])
    } else {
      setName("")
      setContact("")
      setIndustry("")
      setSelectedProfileIds([])
    }
  }, [customer, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: customer?.id, name, contact, industry, profile_ids: selectedProfileIds })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? dict.editTitle : dict.addTitle}</DialogTitle>
          <DialogDescription>{customer ? dict.editDescription : dict.addDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {dict.nameLabel}
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{customer ? dict.saveChangesButton : dict.addCustomerButton}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
