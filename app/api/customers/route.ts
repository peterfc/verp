import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  
  const supabase = await createServerClient();
  // Fetch customers and their associated profiles
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*, customer_profiles(profile_id, profiles(id, name, email))") // Select customer_profiles and then join profiles
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the data structure for easier consumption on the frontend
  const formattedCustomers = customers.map((customer) => ({
    ...customer,
    profiles: customer.customer_profiles.map((cp: any) => cp.profiles), // Extract the nested profile object
  }))

  return NextResponse.json(formattedCustomers)
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { name, contact, industry, profile_ids } = await request.json()

  // Start a transaction (conceptual, as Supabase client doesn't have explicit transactions for multiple calls)
  // In a real-world scenario, for atomicity, you might use a stored procedure or a single RPC call.
  const { data: newCustomer, error: customerError } = await supabase
    .from("customers")
    .insert([{ name, contact, industry }])
    .select()
    .single()

  if (customerError) {
    console.error("Error creating customer:", customerError)
    return NextResponse.json({ error: customerError.message }, { status: 500 })
  }

  if (profile_ids && profile_ids.length > 0) {
    const customerProfilesData = profile_ids.map((profile_id: string) => ({
      customer_id: newCustomer.id,
      profile_id: profile_id,
    }))

    const { error: cpError } = await supabase.from("customer_profiles").insert(customerProfilesData)

    if (cpError) {
      console.error("Error associating profiles with new customer:", cpError)
      // Optionally, roll back the customer creation here if cpError is critical
      return NextResponse.json({ error: cpError.message }, { status: 500 })
    }
  }

  return NextResponse.json(newCustomer, { status: 201 })
}
