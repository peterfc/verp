/* SERVER ─────────────────────────────────────────────────────────── */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

/* Helper: turn any PostgREST / Supabase error into a readable sentence */
function explain(err: any): string {
  return (
    err?.message ||
    err?.details ||
    err?.hint ||
    (err?.code ? `Postgres error code ${err.code}` : "") ||
    "Unexpected error while processing data-types request."
  ).trim()
}

/* ────────────────────────────  LIST  ────────────────────────────── */
export async function GET() {
  const supabase = await createServerClient();

  // Get current user and check their role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check current user's profile type
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single()

  // Get current organization for non-admin users
  const cookieStore = await cookies()
  const currentOrganizationId = cookieStore.get("current-organization")?.value
  
  const isAdmin = currentProfile?.type === 'Administrator'

  if (!isAdmin && !currentOrganizationId) {
    console.log("Non-admin user has no current organization set")
    return NextResponse.json([])
  }

  let dataTypesQuery = supabase
    .from("data_types")
    .select("*")
    .order("created_at", { ascending: false })

  // If user is not an admin, filter by their current organization
  if (!isAdmin && currentOrganizationId) {
    console.log("Non-admin user, filtering data types for organization:", currentOrganizationId)
    dataTypesQuery = dataTypesQuery.eq("organization_id", currentOrganizationId)
  } else if (isAdmin) {
    console.log("Admin user, fetching all data types")
  }

  /* 1️⃣  fetch data_types (filtered by organization for non-admins) */
  const { data: dataTypes, error: dtError } = await dataTypesQuery

  if (dtError) {
    console.error("GET /api/data-types →", dtError)

    /* If the migrations haven't run yet the table won't exist (code 42P01). 
       Instead of crashing the UI, return an empty list so the page can still render. */
    if (dtError.code === "42P01") {
      return NextResponse.json([], { status: 200 })
    }

    const status = dtError.code === "42501" ? 403 : 500
    return NextResponse.json({ error: explain(dtError) }, { status })
  }

  if (!dataTypes?.length) return NextResponse.json([], { status: 200 })

  /* 2️⃣  collect distinct organization_ids */
  const orgIds = [...new Set(dataTypes.map((d: any) => d.organization_id).filter(Boolean))]

  /* 3️⃣  fetch those organizations */
  const { data: orgs, error: orgError } = await supabase.from("organizations").select("id,name").in("id", orgIds)

  if (orgError) {
    console.error("GET /api/data-types (orgs) →", orgError)
    /* still return bare data_types if org lookup failed */
    return NextResponse.json(
      dataTypes.map((d: any) => ({ ...d, organization: null })),
      { status: 200 },
    )
  }

  const nameById: Record<string, string> = Object.fromEntries(orgs.map((o: any) => [o.id, o.name]))

  /* 4️⃣  attach {id,name} to each data_type */
  const formatted = dataTypes.map((d: any) => ({
    ...d,
    organization: d.organization_id ? { id: d.organization_id, name: nameById[d.organization_id] ?? "N/A" } : null,
  }))

  return NextResponse.json(formatted, { status: 200 })
}

/* ─────────────────────────── CREATE  ─────────────────────────────── */
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { name, fields, organization_id } = await request.json()

  if (!name || !organization_id) {
    return NextResponse.json({ error: "Both 'name' and 'organization_id' are required." }, { status: 400 })
  }

  try {
    const now = new Date().toISOString() // Get current timestamp

    const { data } = await supabase
      .from("data_types")
      .insert([{ name, fields, organization_id, created_at: now, updated_at: now }]) // Set timestamps here
      .select()
      .single()
      .throwOnError()

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/data-types →", err)
    /* 42501 = RLS / permission denied, 23503 = foreign-key violation */
    const status = err?.code === "42501" ? 403 : err?.code === "23503" ? 409 : 400
    return NextResponse.json({ error: explain(err) }, { status })
  }
}
