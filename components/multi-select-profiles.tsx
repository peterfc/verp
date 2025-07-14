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
    if (disabled) return // Prevent selection if disabled
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
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      {" "}
      {/* Disable popover if disabled */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[36px] flex-wrap bg-transparent"
          disabled={disabled} // Apply disabled prop to the button
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
            dict.selectProfilesPlaceholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={dict.searchProfilesPlaceholder} disabled={disabled} />{" "}
          {/* Disable input if disabled */}
          <CommandList>
            <CommandEmpty>{dict.noProfilesFound}</CommandEmpty>
            <CommandGroup>
              {profiles.map((profile) => (
                <CommandItem
                  key={profile.id}
                  value={profile.name}
                  onSelect={() => handleSelect(profile.id)}
                  disabled={disabled} // Disable individual items if disabled
                >
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
