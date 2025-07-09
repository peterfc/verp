"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Profile {
  id: string
  name: string
  email: string
}

interface MultiSelectProfilesProps {
  profiles: Profile[]
  selectedProfileIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function MultiSelectProfiles({ profiles, selectedProfileIds, onSelectionChange }: MultiSelectProfilesProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (profileId: string) => {
    const isSelected = selectedProfileIds.includes(profileId)
    if (isSelected) {
      onSelectionChange(selectedProfileIds.filter((id) => id !== profileId))
    } else {
      onSelectionChange([...selectedProfileIds, profileId])
    }
  }

  const selectedNames = selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id)?.name)
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
            "Select profiles..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search profiles..." />
          <CommandList>
            <CommandEmpty>No profiles found.</CommandEmpty>
            <CommandGroup>
              {profiles.map((profile) => (
                <CommandItem key={profile.id} value={profile.name} onSelect={() => handleSelect(profile.id)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProfileIds.includes(profile.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {profile.name} ({profile.email})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
