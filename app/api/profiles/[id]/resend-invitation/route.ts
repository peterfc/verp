import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Check if current user is admin or manager
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single()

    if (!currentProfile || (currentProfile.type !== 'Administrator' && currentProfile.type !== 'Manager')) {
      return NextResponse.json({ error: "Forbidden: Only admins and managers can resend invitations" }, { status: 403 })
    }

    // Get the profile to resend invitation for
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name, type")
      .eq("id", id)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Additional permission check: managers can't resend invitations for other managers or admins
    if (currentProfile.type === 'Manager' && (targetProfile.type === 'Manager' || targetProfile.type === 'Administrator')) {
      return NextResponse.json({ error: "Forbidden: Managers cannot resend invitations for other managers or administrators" }, { status: 403 })
    }

    // Check if this profile needs password setup
    const { data: profileCheck, error: profileCheckError } = await supabase
      .from("profiles")
      .select("needs_password_setup")
      .eq("id", id)
      .single()

    if (profileCheckError) {
      console.error("Error checking profile setup status:", profileCheckError)
      return NextResponse.json({ error: "Failed to check profile status" }, { status: 500 })
    }

    // Only allow resending invitations for profiles that need password setup
    if (!profileCheck.needs_password_setup) {
      return NextResponse.json({ 
        error: "This user does not need password setup. Invitation cannot be resent." 
      }, { status: 400 })
    }

    // Instead of deleting the auth user, let's just send a password reset email
    // This will invalidate old invitation links and send a fresh one
    console.log("Sending fresh password reset email to:", targetProfile.email)
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetProfile.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
    })

    if (resetError) {
      console.error("Error sending password reset email:", resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    console.log("Invitation resent successfully to:", targetProfile.email)
    
    // Ensure the profile is marked as needing password setup
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ needs_password_setup: true })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating needs_password_setup flag:", updateError)
      // Don't fail the request, just log the error
    }
    
        return NextResponse.json({ 
      message: `Invitation resent successfully to ${targetProfile.email}`
    })

  } catch (error: any) {
    console.error("Error in resend invitation:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
