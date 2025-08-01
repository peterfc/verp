"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Organization } from "@/types/data"

interface OrganizationDropdownProps {
  currentOrganization: Organization
  userOrganizations: Organization[]
  lang: string
}

export function OrganizationDropdown({ 
  currentOrganization, 
  userOrganizations, 
  lang 
}: OrganizationDropdownProps) {
  const [isChanging, setIsChanging] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleOrganizationChange = async (organizationId: string) => {
    if (organizationId === currentOrganization.id || isChanging) return

    setIsChanging(true)

    try {
      const response = await fetch("/api/set-current-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      })

      if (!response.ok) {
        throw new Error("Failed to change organization")
      }

      // Force a hard refresh to ensure all data is updated with the new organization
      window.location.reload()
    } catch (error) {
      console.error("Error changing organization:", error)
      toast({
        title: "Error",
        description: "Failed to change organization. Please try again.",
        variant: "destructive",
      })
      setIsChanging(false) // Only reset if there's an error, otherwise page will reload
    }
  }

  // If user only has one organization, just display the name (no dropdown)
  if (userOrganizations.length <= 1) {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        {currentOrganization.name}
      </span>
    )
  }

  // If user has multiple organizations, show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-auto p-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          disabled={isChanging}
        >
          {currentOrganization.name}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {userOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrganizationChange(org.id)}
            disabled={org.id === currentOrganization.id}
          >
            <div>
              <div className="font-medium">{org.name}</div>
              {org.industry && (
                <div className="text-xs text-muted-foreground">{org.industry}</div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
