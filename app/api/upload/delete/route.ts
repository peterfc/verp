import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Extract the filename from the URL to verify user ownership
    const urlParts = url.split("/")
    const filename = urlParts[urlParts.length - 1]

    // Check if the file belongs to the current user
    if (!filename.startsWith(user.id + "/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete from Vercel Blob
    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
