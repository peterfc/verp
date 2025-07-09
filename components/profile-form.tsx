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

interface ProfileFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  profile?: { id: string; name: string; email: string }
  onSave: (profile: { id?: string; name: string; email: string }) => void
}

export function ProfileForm({ isOpen, onOpenChange, profile, onSave }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || "")
  const [email, setEmail] = useState(profile?.email || "")

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
    } else {
      setName("")
      setEmail("")
    }
  }, [profile, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: profile?.id, name, email })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{profile ? "Edit Profile" : "Add Profile"}</DialogTitle>
          <DialogDescription>
            {profile ? "Make changes to the profile here." : "Add a new profile to your list."}
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
            <Label htmlFor="email" className="text-right">
              Email
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
          <DialogFooter>
            <Button type="submit">{profile ? "Save changes" : "Add Profile"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
