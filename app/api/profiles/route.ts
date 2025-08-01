import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createServerClient();
  
  // First, let's debug what we can see
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  console.log("Current user ID:", user?.id)
  
  // Check current user's profile type
  if (user) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("type, name, email")
      .eq("id", user.id)
      .single()
    console.log("Current user profile:", currentProfile)
    
    // If user is admin, bypass RLS to get all profiles
    if (currentProfile?.type === 'Administrator') {
      console.log("User is admin, fetching all profiles bypassing RLS")
      const { data: allProfiles, error: adminError } = await supabase
        .from("profiles")
        .select("*")
        .order("name")
      
      if (adminError) {
        console.error("Error fetching profiles as admin:", adminError)
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }
      
      console.log("All profiles for admin:", allProfiles?.length || 0)
      return NextResponse.json(allProfiles)
    }
    
    // For non-admin users, get only profiles from their current organization
    const cookieStore = await cookies()
    const currentOrganizationId = cookieStore.get("current-organization")?.value
    
    if (!currentOrganizationId) {
      console.log("Non-admin user has no current organization set")
      return NextResponse.json([])
    }
    
    console.log("Non-admin user, fetching profiles for organization:", currentOrganizationId)
    
    // Get profiles that belong to the same organization as the current user
    const { data: orgProfiles, error: orgError } = await supabase
      .from("organization_profiles")
      .select(`
        profile_id,
        profiles (
          id,
          email,
          name,
          type,
          created_at,
          needs_password_setup
        )
      `)
      .eq("organization_id", currentOrganizationId)
    
    if (orgError) {
      console.error("Error fetching organization profiles:", orgError)
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }
    
    const profiles = orgProfiles
      ?.map(op => op.profiles)
      .filter(profile => profile !== null) || []
    
    console.log("Profiles for organization:", profiles.length)
    return NextResponse.json(profiles)
  }

  // If no user, return empty array
  return NextResponse.json([])
}

// POST creates a new user with Supabase Auth and then creates the profile
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { name, email, type, organization_ids } = await request.json()

  // Check if the current user is an administrator
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the current user's profile to check if they're an admin
  const { data: currentUserProfile, error: profileError } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single()

  if (profileError || !currentUserProfile || currentUserProfile.type !== "Administrator") {
    return NextResponse.json({ error: "Only administrators can create profiles" }, { status: 403 })
  }

  try {
    // Check if a profile with this email already exists
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("email", email)
      .single()

    if (profileLookupError && profileLookupError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      console.error("Error checking existing profiles:", profileLookupError)
      return NextResponse.json({ error: "Failed to check existing profiles" }, { status: 500 })
    }

    if (existingProfile) {
      return NextResponse.json({ 
        error: `A profile with email ${email} already exists (Name: ${existingProfile.name}, ID: ${existingProfile.id})` 
      }, { status: 400 })
    }

    // Also check without RLS in case the profile exists but is hidden
    const { data: allProfilesWithEmail } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("email", email)

    if (allProfilesWithEmail && allProfilesWithEmail.length > 0) {
      console.log("Found profiles with this email (bypassing RLS):", allProfilesWithEmail)
      return NextResponse.json({ 
        error: `Profile with email ${email} exists but may be hidden by RLS. Found ${allProfilesWithEmail.length} profile(s)` 
      }, { status: 400 })
    }

    // Check if auth user with this email already exists
    console.log("Checking for existing auth users with email:", email)
    const adminClient = createAdminClient()
    const { data: existingUsers, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error("Error checking existing auth users:", usersError)
      return NextResponse.json({ error: "Failed to check existing auth users" }, { status: 500 })
    }

    const existingAuthUser = existingUsers.users.find(u => u.email === email)
    if (existingAuthUser) {
      console.log("Found existing auth user:", {
        id: existingAuthUser.id,
        email: existingAuthUser.email,
        created_at: existingAuthUser.created_at
      })
      
      // Check if this auth user has a profile
      const { data: authUserProfile, error: authProfileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", existingAuthUser.id)
        .single()

      if (authProfileError && authProfileError.code !== 'PGRST116') {
        console.error("Error checking auth user's profile:", authProfileError)
        return NextResponse.json({ error: "Failed to check auth user's profile" }, { status: 500 })
      }

      if (authUserProfile) {
        return NextResponse.json({ 
          error: `Auth user and profile already exist for ${email}. Profile: ${authUserProfile.name}` 
        }, { status: 400 })
      } else {
        // Auth user exists but no profile - we can create a profile for this user
        console.log("Auth user exists but no profile found, creating profile for existing user")
        
        // Double-check by bypassing RLS to see if profile really doesn't exist
        const { data: hiddenProfile, error: hiddenProfileError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", existingAuthUser.id)
          .single()

        if (!hiddenProfileError && hiddenProfile) {
          console.log("Found hidden profile:", hiddenProfile)
          return NextResponse.json({ 
            error: `Profile already exists but may be hidden by RLS. Profile: ${hiddenProfile.name} (${hiddenProfile.email})` 
          }, { status: 400 })
        }
        
        const { data: profileData, error: profileCreateError } = await supabase
          .from("profiles")
          .insert([{ 
            id: existingAuthUser.id, 
            name, 
            email, 
            type,
            needs_password_setup: true // Mark that this user needs to set up their password
          }])
          .select()
          .single()

        if (profileCreateError) {
          console.error("Error creating profile for existing auth user:", profileCreateError)
          return NextResponse.json({ error: profileCreateError.message }, { status: 500 })
        }

        // If organization_ids are provided, associate the profile with those organizations
        if (organization_ids && organization_ids.length > 0) {
          const organizationProfilesData = organization_ids.map((org_id: string) => ({
            organization_id: org_id,
            profile_id: existingAuthUser.id,
          }))

          const { error: orgAssocError } = await supabase
            .from("organization_profiles")
            .insert(organizationProfilesData)

          if (orgAssocError) {
            console.error("Error associating profile with organizations:", orgAssocError)
            return NextResponse.json({ 
              error: `Profile created but failed to associate with organizations: ${orgAssocError.message}` 
            }, { status: 500 })
          }

          console.log("Successfully associated existing user profile with", organization_ids.length, "organizations")
        }

        // Send password setup email using admin invite with longer expiry preference
        console.log("Sending password setup invitation to existing user:", email)
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
        })

        if (inviteError) {
          console.error("Error sending invitation email:", inviteError)
          // Fall back to reset password approach which may have longer expiry
          console.log("Falling back to password reset email (may have longer expiry)...")
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
          })
          if (resetError) {
            console.error("Error sending password reset email:", resetError)
            console.warn("Profile created successfully but failed to send password setup email")
          } else {
            console.log("Password reset email sent successfully to:", email)
          }
        } else {
          console.log("Invitation email sent successfully to:", email)
        }

        return NextResponse.json({
          ...profileData,
          message: "Profile created successfully. User will receive an email to set up their password."
        }, { status: 201 })
      }
    }

    // First, create the user in Supabase Auth
    // Note: This will trigger automatic profile creation via database trigger
    console.log("Creating new auth user for email:", email)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Generate a random temporary password
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        name,
        invited_by: user.email,
      }
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log("Created auth user with ID:", authData.user.id, "for email:", email)

    // The database trigger should have automatically created a profile
    // Let's wait a moment and then try to find it
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for trigger to complete

    // Try to find the automatically created profile
    const { data: autoCreatedProfile, error: profileFindError } = await supabase
      .from("profiles")
      .select("id, name, email, type")
      .eq("id", authData.user.id)
      .single()

    if (profileFindError || !autoCreatedProfile) {
      console.log("Auto-created profile not found, creating manually...")
      
      // If for some reason the trigger didn't work, create the profile manually
      const { data: profileData, error: profileCreateError } = await supabase
        .from("profiles")
        .insert([{ 
          id: authData.user.id, 
          name, 
          email, 
          type,
          needs_password_setup: true // Mark that this user needs to set up their password
        }])
        .select()
        .single()

      if (profileCreateError) {
        console.error("Error creating profile manually:", profileCreateError)
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileCreateError.message }, { status: 500 })
      }
      
      // Associate with organizations
      if (organization_ids && organization_ids.length > 0) {
        const organizationProfilesData = organization_ids.map((org_id: string) => ({
          organization_id: org_id,
          profile_id: authData.user.id,
        }))

        const { error: orgAssocError } = await supabase
          .from("organization_profiles")
          .insert(organizationProfilesData)

        if (orgAssocError) {
          console.error("Error associating manually created profile with organizations:", orgAssocError)
          return NextResponse.json({ 
            error: `Profile created but failed to associate with organizations: ${orgAssocError.message}` 
          }, { status: 500 })
        }
      }

      // Send password setup email using admin invite instead of reset
      console.log("Sending password setup invitation to:", email)
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
      })

      if (inviteError) {
        console.error("Error sending invitation email:", inviteError)
        // Fall back to reset password approach
        console.log("Falling back to password reset email...")
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
        })
        if (resetError) {
          console.error("Error sending password reset email:", resetError)
          console.warn("Profile created successfully but failed to send password setup email")
        } else {
          console.log("Password reset email sent successfully to:", email)
        }
      } else {
        console.log("Invitation email sent successfully to:", email)
      }

      return NextResponse.json({
        ...profileData,
        message: "Profile created successfully. User will receive an email to set up their password."
      }, { status: 201 })
    }

    // Profile was auto-created by trigger, now update it with the proper type, name, and password setup flag
    console.log("Found auto-created profile:", autoCreatedProfile)
    console.log("Updating auto-created profile with proper type, name, and password setup flag...")
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ 
        name: name, // Update name in case trigger used a different value
        type: type, // Set the proper type
        needs_password_setup: true // Mark that this user needs to set up their password
      })
      .eq("id", authData.user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating auto-created profile:", updateError)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: `Profile auto-created but failed to update: ${updateError.message}` }, { status: 500 })
    }

    // If organization_ids are provided, associate the profile with those organizations
    if (organization_ids && organization_ids.length > 0) {
      const organizationProfilesData = organization_ids.map((org_id: string) => ({
        organization_id: org_id,
        profile_id: authData.user.id,
      }))

      const { error: orgAssocError } = await supabase
        .from("organization_profiles")
        .insert(organizationProfilesData)

      if (orgAssocError) {
        console.error("Error associating updated profile with organizations:", orgAssocError)
        return NextResponse.json({ 
          error: `Profile updated but failed to associate with organizations: ${orgAssocError.message}` 
        }, { status: 500 })
      }

      console.log("Successfully associated updated profile with", organization_ids.length, "organizations")
    }

    // Send password setup email using admin invite instead of reset
    console.log("Sending password setup invitation to:", email)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
    })

    if (inviteError) {
      console.error("Error sending invitation email:", inviteError)
      // Fall back to reset password approach
      console.log("Falling back to password reset email...")
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password?message=password-setup`
      })
      if (resetError) {
        console.error("Error sending password reset email:", resetError)
        console.warn("Profile created successfully but failed to send password setup email")
      } else {
        console.log("Password reset email sent successfully to:", email)
      }
    } else {
      console.log("Invitation email sent successfully to:", email)
    }

    return NextResponse.json({
      ...updatedProfile,
      message: "Profile created successfully. User will receive an email to set up their password."
    }, { status: 201 })
    
  } catch (error: any) {
    console.error("Unexpected error creating profile:", error)
    return NextResponse.json({ error: error.message || "Failed to create profile" }, { status: 500 })
  }
}
