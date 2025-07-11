"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Profile {
  id: string
  name: string
  email: string
  type: string
}

interface ProfileEditorProps {
  profile?: Profile // Optional, for editing existing profiles
  onSave: (profile: { id?: string; name: string; email: string; type: string }) => void
  onCancel: () => void
  dict: {
    editorTitle: string
    editorDescription: string
    nameLabel: string
    emailLabel: string
    typeLabel: string
    typeOptions: {
      administrator: string
      manager: string
      user: string
    }
    saveButton: string
    cancelButton: string
  }
  isAdmin: boolean
  isManager: boolean
}

export function ProfileEditor({ profile, onSave, onCancel, dict, isAdmin, isManager }: ProfileEditorProps) {
  const [name, setName] = useState(profile?.name || "")
  const [email, setEmail] = useState(profile?.email || "")
  const [type, setType] = useState(profile?.type || "User")

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
      setType(profile.type)
    } else {
      setName("")
      setEmail("")
      setType("User")
    }
  }, [profile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: profile?.id, name, email, type })
  }

  // Determine if the type dropdown should be disabled
  // It's enabled if:
  // 1. Current user is an Admin
  // 2. Current user is a Manager AND the profile being edited is NOT an Administrator
  const isTypeSelectDisabled = !isAdmin && (!isManager || (profile && profile.type === "Administrator"))

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.editorTitle}</CardTitle>
        <CardDescription>{dict.editorDescription}</CardDescription>
      </CardHeader>
      <CardContent>
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
          {/* Profile Type Select */}
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
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {dict.cancelButton}
        </Button>
        <Button type="submit" onClick={handleSubmit}>
          {dict.saveButton}
        </Button>
      </CardFooter>
    </Card>
  )
}
