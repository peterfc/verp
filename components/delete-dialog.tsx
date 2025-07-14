"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteDialogProps {
  // Allow both 'open' and 'isOpen' for flexibility
  open?: boolean
  isOpen?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemType: string
  itemName: string
  dict?: {
    confirmTitle?: string
    confirmDescription?: string
    cancelButton?: string
    deleteButton?: string
  }
  title?: string // Allow direct title prop
  description?: string // Allow direct description prop
}

export function DeleteDialog({
  open,
  isOpen,
  onOpenChange,
  onConfirm,
  itemType,
  itemName,
  dict,
  title,
  description,
}: DeleteDialogProps) {
  const effectiveOpen = open ?? isOpen // Use whichever prop is provided

  // Fallback to default strings if dict or specific keys are undefined
  const confirmTitle = title || dict?.confirmTitle || `Confirm Deletion of ${itemType}`
  const confirmDescription =
    description ||
    dict?.confirmDescription ||
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
  const cancelButtonText = dict?.cancelButton || "Cancel"
  const deleteButtonText = dict?.deleteButton || "Delete"

  return (
    <AlertDialog open={effectiveOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelButtonText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{deleteButtonText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
