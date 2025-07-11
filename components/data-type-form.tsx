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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Organization {
  id: string
  name: string
}

interface DataTypeFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  dataType?: {
    id: string
    name: string
    fields: any
    organization_id: string
    organization?: { name: string } // <— changed
  }
  onSave: (dataType: { id?: string; name: string; fields: any; organization_id: string }) => void
  dict: {
    editTitle: string
    addTitle: string
    editDescription: string
    addDescription: string
    nameLabel: string
    fieldsLabel: string
    organizationLabel: string
    saveChangesButton: string
    addDataTypeButton: string
    errorFetchingOrganizations: string
    failedToLoadOrganizations: string
    invalidJson: string
  }
  isAdmin: boolean
  isManager: boolean
}

export function DataTypeForm({ isOpen, onOpenChange, dataType, onSave, dict, isAdmin, isManager }: DataTypeFormProps) {
  const [name, setName] = useState(dataType?.name || "")
  const [fields, setFields] = useState(JSON.stringify(dataType?.fields || [], null, 2))
  const [organizationId, setOrganizationId] = useState(dataType?.organization_id || "")
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const { toast } = useToast()

  // Determine if the form should be disabled
  // It's enabled if:
  // 1. Current user is an Admin
  // 2. Current user is a Manager
  const isFormDisabled = !isAdmin && !isManager

  useEffect(() => {
    if (isOpen) {
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
            title: dict.errorFetchingOrganizations,
            description: err.message || dict.failedToLoadOrganizations,
            variant: "destructive",
          })
          console.error(err)
        }
      }
      fetchAllOrganizations()
    }
  }, [isOpen, toast, dict])

  useEffect(() => {
    if (dataType) {
      setName(dataType.name)
      setFields(JSON.stringify(dataType.fields || [], null, 2))
      setOrganizationId(dataType.organization_id)
    } else {
      setName("")
      setFields("[]")
      setOrganizationId("")
    }
  }, [dataType, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormDisabled) {
      toast({
        title: dict.addTitle,
        description: "You do not have permission to edit data types.",
        variant: "destructive",
      })
      return
    }

    let parsedFields: any
    try {
      parsedFields = JSON.parse(fields)
    } catch (err) {
      toast({
        title: dict.invalidJson,
        description: "The 'Fields' content is not valid JSON.",
        variant: "destructive",
      })
      return
    }

    if (!organizationId) {
      toast({
        title: dict.errorFetchingOrganizations,
        description: "Please choose an organisation before saving.",
        variant: "destructive",
      })
      return
    }

    onSave({ id: dataType?.id, name, fields: parsedFields, organization_id: organizationId })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dataType ? dict.editTitle : dict.addTitle}</DialogTitle>
          <DialogDescription>{dataType ? dict.editDescription : dict.addDescription}</DialogDescription>
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
            <Label htmlFor="fields" className="text-right">
              {dict.fieldsLabel}
            </Label>
            <Textarea
              id="fields"
              value={fields}
              onChange={(e) => setFields(e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder='e.g., [{"name": "field1", "type": "string"}, {"name": "field2", "type": "number"}]'
              required
              disabled={isFormDisabled}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="organization" className="text-right">
              {dict.organizationLabel}
            </Label>
            <Select value={organizationId} onValueChange={setOrganizationId} disabled={isFormDisabled}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={dict.organizationLabel} />
              </SelectTrigger>
              <SelectContent>
                {allOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isFormDisabled}>
              {dataType ? dict.saveChangesButton : dict.addDataTypeButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
