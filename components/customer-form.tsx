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
import { MultiSelectProfiles } from "./multi-select-profiles" // Import the new component
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
}

export function CustomerForm({ isOpen, onOpenChange, customer, onSave }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "")
  const [contact, setContact] = useState(customer?.contact || "")
  const [industry, setIndustry] = useState(customer?.industry || "")
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch all profiles when the dialog opens
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
            title: "Error fetching profiles",
            description: err.message || "Failed to load profiles for selection.",
            variant: "destructive",
          })
          console.error(err)
        }
      }
      fetchAllProfiles()
    }
  }, [isOpen, toast])

  // Populate form fields and selected profiles when customer prop changes
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
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Make changes to the customer here." : "Add a new customer to your list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
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
              Industry
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
              Profiles
            </Label>
            <div className="col-span-3">
              <MultiSelectProfiles
                profiles={allProfiles}
                selectedProfileIds={selectedProfileIds}
                onSelectionChange={setSelectedProfileIds}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{customer ? "Save changes" : "Add Customer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
