"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table" // Removed TableRow import
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
import { cn } from "@/lib/utils" // Import cn utility for class names

interface Profile {
  id: string
  name: string
  email: string
}

interface Customer {
  id: string
  name: string
  contact: string
  industry: string
  profiles: Profile[] // Now includes associated profiles
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCustomers = useCallback(async () => {
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
      setError(err.message || "Failed to fetch customers.")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch customers.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

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
          body: JSON.stringify(customerData), // Send all data including profile_ids
        })
      } else {
        response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData), // Send all data including profile_ids
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save customer.")
      }
      toast({
        title: "Success",
        description: "Customer saved successfully.",
      })
      fetchCustomers() // Re-fetch customers to update the list
      setIsFormOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to save customer.")
      toast({
        title: "Error",
        description: err.message || "Failed to save customer.",
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
        throw new Error(errorData.error || "Failed to delete customer.")
      }
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      })
      fetchCustomers() // Re-fetch customers to update the list
      setIsDeleteDialogOpen(false)
      setCustomerToDelete(undefined)
    } catch (err: any) {
      setError(err.message || "Failed to delete customer.")
      toast({
        title: "Error",
        description: err.message || "Failed to delete customer.",
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Customers</CardTitle>
          <Button
            onClick={() => {
              setEditingCustomer(undefined)
              setIsFormOpen(true)
            }}
          >
            Add Customer
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading customers...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                {/* Using native <tr> for TableHeader and rendering TableHead as an array */}
                <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted")}>
                  {[
                    <TableHead key="name">Name</TableHead>,
                    <TableHead key="contact">Contact</TableHead>,
                    <TableHead key="industry">Industry</TableHead>,
                    <TableHead key="profiles">Associated Profiles</TableHead>,
                    <TableHead key="actions" className="text-right">
                      Actions
                    </TableHead>,
                  ]}
                </tr>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  // Using native <tr> for "No customers found" row
                  <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted")}>
                    <TableCell colSpan={5} className="text-center py-4">
                      No customers found.
                    </TableCell>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    // Using native <tr> here and rendering TableCell as an array
                    <tr
                      key={customer.id}
                      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted")}
                    >
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
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditForm(customer)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteConfirm(customer)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>,
                      ]}
                    </tr>
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
      />

      {customerToDelete && (
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteCustomer}
          itemType="customer"
          itemName={customerToDelete.name}
        />
      )}
    </div>
  )
}
