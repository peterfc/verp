import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*, customer_profiles(profile_id, profiles(id, name, email))")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  // Flatten the data structure
  const formattedCustomer = {
    ...customer,
    profiles: customer.customer_profiles.map((cp: any) => cp.profiles),
  }

  return NextResponse.json(formattedCustomer)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params
  const { name, contact, industry, profile_ids } = await request.json()

  // Update customer details
  const { data: updatedCustomer, error: customerError } = await supabase
    .from("customers")
    .update({ name, contact, industry })
    .eq("id", id)
    .select()
    .single()

  if (customerError) {
    console.error("Error updating customer:", customerError)
    return NextResponse.json({ error: customerError.message }, { status: 500 })
  }

  if (!updatedCustomer) {
    return NextResponse.json({ error: "Customer not found or no changes made" }, { status: 404 })
  }

  // Update customer_profiles associations
  // 1. Delete existing associations for this customer
  const { error: deleteError } = await supabase.from("customer_profiles").delete().eq("customer_id", id)

  if (deleteError) {
    console.error("Error deleting old customer profiles:", deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // 2. Insert new associations
  if (profile_ids && profile_ids.length > 0) {
    const customerProfilesData = profile_ids.map((profile_id: string) => ({
      customer_id: id,
      profile_id: profile_id,
    }))

    const { error: insertError } = await supabase.from("customer_profiles").insert(customerProfilesData)

    if (insertError) {
      console.error("Error inserting new customer profiles:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Re-fetch the updated customer with its new profiles for the response
  const { data: finalCustomer, error: fetchError } = await supabase
    .from("customers")
    .select("*, customer_profiles(profile_id, profiles(id, name, email))")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error re-fetching customer after update:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const formattedFinalCustomer = {
    ...finalCustomer,
    profiles: finalCustomer.customer_profiles.map((cp: any) => cp.profiles),
  }

  return NextResponse.json(formattedFinalCustomer)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params

  // ON DELETE CASCADE on foreign keys in customer_profiles table will handle deleting associations
  const { error } = await supabase.from("customers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
