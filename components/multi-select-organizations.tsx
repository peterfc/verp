"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Organization {
  id: string
  name: string
}

interface MultiSelectOrganizationsProps {
  organizations: Organization[]
  selectedOrganizationIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function MultiSelectOrganizations({ organizations, selectedOrganizationIds, onSelectionChange }: MultiSelectOrganizationsProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (organizationId: string) => {
    const isSelected = selectedOrganizationIds.includes(organizationId)
    if (isSelected) {
      onSelectionChange(selectedOrganizationIds.filter((id) => id !== organizationId))
    } else {
      onSelectionChange([...selectedOrganizationIds, organizationId])
    }
  }

  const selectedNames = selectedOrganizationIds
    .map((id) => organizations.find((o) => o.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[36px] flex-wrap bg-transparent"
        >
          {selectedNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            "Select organizations..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((organization) => (
                <CommandItem key={organization.id} value={organization.name} onSelect={() => handleSelect(organization.id)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrganizationIds.includes(organization.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {organization.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
