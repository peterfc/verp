"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { DataTypeEditor } from "@/components/data-type-editor"
import { DeleteDialog } from "@/components/delete-dialog"
import { createClient } from "@/lib/supabase/client"
import type { DataType, Field, Organization } from "@/types/data" // Import types from centralized file

interface DataTypeEditFormProps {
  dataType: DataType
  organizations: Organization[]
  availableDataTypes: DataType[]
  lang: string
  isAdmin: boolean
  isManager: boolean
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Data type name is required." }),
  organization_id: z.string().uuid({ message: "Organization ID must be a valid UUID." }),
  fields: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Field name is required." }),
        type: z.enum(["string", "number", "boolean", "date", "json", "dropdown", "file", "reference"]),
        options: z.array(z.string()).optional(),
        tempOptionsInput: z.string().optional(), // Temporary field for form input
        referenceDataTypeId: z.string().uuid().optional().or(z.literal("")), // Allow empty string for no reference
      }),
    )
    .min(1, { message: "At least one field is required." }),
})

export function DataTypeEditForm({
  dataType,
  organizations,
  availableDataTypes,
  lang,
  isAdmin,
  isManager,
}: DataTypeEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: dataType.name,
      organization_id: dataType.organization_id,
      fields: dataType.fields.map((field) => ({
        ...field,
        tempOptionsInput: field.type === "dropdown" && field.options ? field.options.join(", ") : "",
        referenceDataTypeId: field.type === "reference" && field.referenceDataTypeId ? field.referenceDataTypeId : "",
      })),
    },
  })

  useEffect(() => {
    form.reset({
      name: dataType.name,
      organization_id: dataType.organization_id,
      fields: dataType.fields.map((field) => ({
        ...field,
        tempOptionsInput: field.type === "dropdown" && field.options ? field.options.join(", ") : "",
        referenceDataTypeId: field.type === "reference" && field.referenceDataTypeId ? field.referenceDataTypeId : "",
      })),
    })
  }, [dataType, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    try {
      const fieldsToSave = values.fields.map((field) => {
        const newField: Field = {
          name: field.name,
          type: field.type,
        }
        if (field.type === "dropdown") {
          newField.options = field.tempOptionsInput
            ? field.tempOptionsInput
                .split(",")
                .map((option) => option.trim())
                .filter((option) => option.length > 0)
            : []
        }
        if (field.type === "reference") {
          newField.referenceDataTypeId = field.referenceDataTypeId || undefined
        }
        return newField
      })

      const { error } = await supabase
        .from("data_types")
        .update({
          name: values.name,
          organization_id: values.organization_id,
          fields: fieldsToSave,
        })
        .eq("id", dataType.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Data type updated successfully.",
      })
      router.push(`/${lang}/data-types`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update data type.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("data_types").delete().eq("id", dataType.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Data type deleted successfully.",
      })
      router.push(`/${lang}/data-types`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete data type.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const isFormDisabled = !isAdmin && !isManager

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Edit Data Type</CardTitle>
        <CardDescription>Manage the details and fields of your data type.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DataTypeEditor
              form={form}
              organizations={organizations}
              availableDataTypes={availableDataTypes}
              disabled={isFormDisabled}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting || isFormDisabled}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              {(isAdmin || isManager) && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this data type? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isConfirming={isDeleting}
      />
    </Card>
  )
}
