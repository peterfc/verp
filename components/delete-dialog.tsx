"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemType: string
  itemName: string
  dict: {
    // Add dictionary prop
    confirmTitle: string
    confirmDescription: string
    cancelButton: string
    deleteButton: string
  }
}

export function DeleteDialog({ isOpen, onOpenChange, onConfirm, itemType, itemName, dict }: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.confirmTitle}</DialogTitle>
          <DialogDescription>
            {dict.confirmDescription.replace("{itemType}", itemType).replace("{itemName}", itemName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dict.cancelButton}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {dict.deleteButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
