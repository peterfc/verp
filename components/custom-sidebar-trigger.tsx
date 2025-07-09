"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar" // Import useSidebar from shadcn's sidebar

import { cn } from "@/lib/utils"

export const CustomSidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {/* Wrap the children in a single div to satisfy React.Children.only */}
      <div className="flex items-center justify-center">
        <PanelLeft />
        <span className="sr-only">Toggle Sidebar</span>
      </div>
    </Button>
  )
})

CustomSidebarTrigger.displayName = "CustomSidebarTrigger"
