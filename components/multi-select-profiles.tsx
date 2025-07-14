"use client"

import { Button } from "@/components/ui/button"

import * as React from "react"
import { X, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Profile } from "@/types/data" // Import Profile type

interface MultiSelectProfilesProps {
  profiles: Profile[]
  selectedProfileIds: string[]
  onSelectionChange: React.Dispatch<React.SetStateAction<string[]>>
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
  disabled = false, // Default to false
}: MultiSelectProfilesProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = React.useCallback(
    (profileId: string) => {
      onSelectionChange((prev) =>
        prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId],
      )
      setInputValue("")
    },
    [onSelectionChange],
  )

  const handleRemove = React.useCallback(
    (profileId: string) => {
      onSelectionChange((prev) => prev.filter((id) => id !== profileId))
    },
    [onSelectionChange],
  )

  const selectedProfiles = React.useMemo(
    () => profiles.filter((profile) => selectedProfileIds.includes(profile.id)),
    [profiles, selectedProfileIds],
  )

  const availableProfiles = React.useMemo(
    () => profiles.filter((profile) => !selectedProfileIds.includes(profile.id)),
    [profiles, selectedProfileIds],
  )

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] px-3 py-2 bg-transparent"
            disabled={disabled} // Apply disabled prop
          >
            <div className="flex flex-wrap gap-1">
              {selectedProfiles.length > 0 ? (
                selectedProfiles.map((profile) => (
                  <Badge key={profile.id} variant="secondary" className="flex items-center gap-1">
                    {profile.name}
                    {!disabled && ( // Only show remove button if not disabled
                      <button
                        type="button"
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => handleRemove(profile.id)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{dict.selectProfilesPlaceholder}</span>
              )}
            </div>
            <span className="sr-only">{dict.selectProfilesPlaceholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder={dict.searchProfilesPlaceholder}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled} // Apply disabled prop
            />
            <CommandGroup>
              {availableProfiles.length > 0 ? (
                availableProfiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.name}
                    onSelect={() => handleSelect(profile.id)}
                    className="cursor-pointer"
                    disabled={disabled} // Apply disabled prop
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedProfileIds.includes(profile.id) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {profile.name}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled={true}>{dict.noProfilesFound}</CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
