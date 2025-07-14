"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Import CommandList
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Profile } from "@/types/data" // Import Profile from types/data

interface MultiSelectProfilesProps {
  profiles: Profile[]
  selectedProfileIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  dict: {
    selectProfilesPlaceholder: string
    searchProfilesPlaceholder: string
    noProfilesFound: string
  }
  disabled?: boolean // Added disabled prop
}

export function MultiSelectProfiles({
  profiles,
  selectedProfileIds,
  onSelectionChange,
  dict,
  disabled, // Destructure disabled prop
}: MultiSelectProfilesProps) {
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
    .map((id) => profiles.find((profile) => profile.id === id)?.name)
    .filter(Boolean)
    .join(", ")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled} // Apply disabled prop to the button
        >
          {selectedProfileIds.length > 0 ? selectedNames : dict.selectProfilesPlaceholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={dict.searchProfilesPlaceholder} />
          <CommandList>
            {" "}
            {/* Wrap CommandGroup and CommandEmpty in CommandList */}
            <CommandEmpty>{dict.noProfilesFound}</CommandEmpty>
            <CommandGroup>
              {profiles.map((profile) => (
                <CommandItem
                  key={profile.id}
                  value={profile.name}
                  onSelect={() => handleSelect(profile.id)}
                  disabled={disabled} // Apply disabled prop to command items
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProfileIds.includes(profile.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {profile.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
