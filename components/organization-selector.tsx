"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Organization } from "@/types/data"

interface OrganizationSelectorProps {
  organizations: Organization[]
  dict: {
    title: string
    description: string
    selectButton: string
    loading: string
  }
  lang: string
}

export function OrganizationSelector({ organizations, dict, lang }: OrganizationSelectorProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!selectedOrganizationId) {
      toast({
        title: "Error",
        description: "Please select an organization.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Set the organization cookie
      const response = await fetch("/api/set-current-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrganizationId }),
      })

      if (!response.ok) {
        throw new Error("Failed to set organization")
      }

      // Redirect to the main dashboard
      router.push(`/${lang}`)
      router.refresh()
    } catch (error) {
      console.error("Error setting organization:", error)
      toast({
        title: "Error",
        description: "Failed to set organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{dict.title}</CardTitle>
          <CardDescription>{dict.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center space-x-2">
                <RadioGroupItem value={org.id} id={org.id} />
                <Label htmlFor={org.id} className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">{org.name}</div>
                    {org.industry && <div className="text-sm text-muted-foreground">{org.industry}</div>}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedOrganizationId || isSubmitting} 
            className="mt-6 w-full"
          >
            {isSubmitting ? dict.loading : dict.selectButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
