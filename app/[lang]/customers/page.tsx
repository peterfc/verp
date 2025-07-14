"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CustomerForm } from "@/components/customer-form"
import { DeleteDialog } from "@/components/delete-dialog"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/types/data" // Import Profile and Customer from shared types

export default function CustomersPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null) // State to hold dictionary

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch(`/api/dictionaries/customers/${lang}`)
        if (!response.ok) {
          throw new Error("Failed to fetch customers dictionary")
        }
        const data = await response.json()
        setDict(data)
      } catch (err) {
        console.error(err)
        // Fallback to a minimal English dictionary if fetch fails
        setDict({
          customersPage: {
            title: "Customers",
            loadingCustomers: "Loading customers...",
            failedToFetchCustomers: "Failed to fetch customers.",
            customerSaved: "Customer saved successfully.",
            customerDeleted: "Customer deleted successfully.",
            failedToSaveCustomer: "Failed to save customer.",
            failedToDeleteCustomer: "Failed to delete customer.",
            contact: "Contact",
            industry: "Industry",
            associatedProfiles: "Associated Profiles",
          },
          customerForm: {
            editTitle: "Edit Customer",
            addTitle: "Add Customer",
            editDescription: "Make changes to the customer here.",
            addDescription: "Add a new customer to your list.",
            contactLabel: "Contact",
            industryLabel: "Industry",
            profilesLabel: "Profiles",
            errorFetchingProfiles: "Error fetching profiles",
            failedToLoadProfiles: "Failed to load profiles for selection.",
          },
          multiSelectProfiles: {
            selectProfilesPlaceholder: "Select profiles...",
            searchProfilesPlaceholder: "Search profiles...",
            noProfilesFound: "No profiles found.",
          },
          common: {
            name: "Name",
            email: "Email",
            actions: "Actions",
            edit: "Edit",
            delete: "Delete",
            saveChanges: "Save changes",
            cancel: "Cancelar",
            loading: "Loading...",
            error: "Error",
            success: "Success",
            noDataFound: "No {itemType} found.",
            confirmDeletion: "Confirm Deletion",
            confirmDeletionDescription:
              'Are you sure you want to delete the {itemType} "{itemName}"? This action cannot be undone.',
            deleteButton: "Delete",
            add: "Add {itemType}",
          },
        })
      }
    }
    loadDictionary()
  }, [lang])

  const fetchCustomers = useCallback(async () => {
    if (!dict) return // Wait for dictionary to load
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: Customer[] = await response.json()
      setCustomers(data)
    } catch (err: any) {
      setError(err.message || dict?.customersPage.failedToFetchCustomers || "Failed to fetch customers.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.customersPage.failedToFetchCustomers || "Failed to fetch customers.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dict, toast])

  useEffect(() => {
    if (dict) {
      fetchCustomers()
    }
  }, [fetchCustomers, dict])

  const handleSaveCustomer = async (customerData: {
    id?: string
    name: string
    contact: string
    industry: string
    profile_ids: string[]
  }) => {
    setError(null)
    try {
      let response: Response
      if (customerData.id) {
        response = await fetch(`/api/customers/${customerData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData),
        })
      } else {
        response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || dict?.customersPage.failedToSaveCustomer || "Failed to save customer.")
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.customersPage.customerSaved || "Customer saved successfully.",
      })
      fetchCustomers()
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || dict?.customersPage.failedToSaveCustomer || "Failed to save customer.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.customersPage.failedToSaveCustomer || "Failed to save customer.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return
    setError(null)
    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || dict?.customersPage.failedToDeleteCustomer || "Failed to delete customer.")
      }
      toast({
        title: dict?.common.success || "Success",
        description: dict?.customersPage.customerDeleted || "Customer deleted successfully.",
      })
      fetchCustomers()
      setIsDeleteDialogOpen(false)
      setCustomerToDelete(undefined)
    } catch (err: any) {
      setError(err.message || dict?.customersPage.failedToDeleteCustomer || "Failed to delete customer.")
      toast({
        title: dict?.common.error || "Error",
        description: err.message || dict?.customersPage.failedToDeleteCustomer || "Failed to delete customer.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsFormOpen(true)
  }

  const openDeleteConfirm = (customer: Customer) => {
    setCustomerToDelete(customer)
    setIsDeleteDialogOpen(true)
  }

  if (!dict) return null // Don't render until dictionary is loaded

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{dict.customersPage.title}</CardTitle>
          <Button
            onClick={() => {
              setEditingCustomer(undefined)
              setIsFormOpen(true)
            }}
          >
            {dict.common.add.replace("{itemType}", dict.customersPage.title.toLowerCase())}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">{dict.customersPage.loadingCustomers}</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {dict.common.error}: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.common.name}</TableHead>
                  <TableHead>{dict.customersPage.contact}</TableHead>
                  <TableHead>{dict.customersPage.industry}</TableHead>
                  <TableHead>{dict.customersPage.associatedProfiles}</TableHead>
                  <TableHead className="text-right">{dict.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {dict.common.noDataFound.replace("{itemType}", dict.customersPage.title.toLowerCase())}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      {[
                        <TableCell key="name" className="font-medium">
                          {customer.name}
                        </TableCell>,
                        <TableCell key="contact">{customer.contact}</TableCell>,
                        <TableCell key="industry">{customer.industry}</TableCell>,
                        <TableCell key="profiles">
                          {customer.profiles?.length ? customer.profiles.map((p) => p.name).join(", ") : "None"}
                        </TableCell>,
                        <TableCell key="actions" className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{dict.common.actions}</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditForm(customer)}>
                                {dict.common.edit}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteConfirm(customer)}>
                                {dict.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>,
                      ]}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        dict={{
          editTitle: dict.customerForm.editTitle,
          addTitle: dict.customerForm.addTitle,
          editDescription: dict.customerForm.editDescription,
          addDescription: dict.customerForm.addDescription,
          nameLabel: dict.common.name,
          contactLabel: dict.customerForm.contactLabel,
          industryLabel: dict.customerForm.industryLabel,
          profilesLabel: dict.customerForm.profilesLabel,
          saveChangesButton: dict.common.saveChanges,
          addCustomerButton: dict.common.add.replace("{itemType}", dict.customersPage.title.toLowerCase()),
          errorFetchingProfiles: dict.customerForm.errorFetchingProfiles,
          failedToLoadProfiles: dict.customerForm.failedToLoadProfiles,
          selectProfilesPlaceholder: dict.multiSelectProfiles.selectProfilesPlaceholder,
          searchProfilesPlaceholder: dict.multiSelectProfiles.searchProfilesPlaceholder,
          noProfilesFound: dict.multiSelectProfiles.noProfilesFound,
        }}
      />

      {customerToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteCustomer}
          itemType={dict.customersPage.title.toLowerCase()}
          itemName={customerToDelete.name}
          dict={{
            confirmTitle: dict.common.confirmDeletion,
            confirmDescription: dict.common.confirmDeletionDescription,
            cancelButton: dict.common.cancel,
            deleteButton: dict.common.deleteButton,
          }}
        />
      )}
    </div>
  )
}
