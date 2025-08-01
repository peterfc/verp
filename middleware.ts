import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import Negotiator from "negotiator"
import { match } from "@formatjs/intl-localematcher"

const locales = ["en", "es"]
const defaultLocale = "en"

function getLocale(request: NextRequest) {
  const acceptLanguageHeader = request.headers.get("accept-language")
  const languages = new Negotiator({ headers: { "accept-language": acceptLanguageHeader || "" } }).languages()
  return match(languages, locales, defaultLocale)
}

export async function middleware(request: NextRequest) {
  console.log(`MIDDLEWARE START: ${request.nextUrl.pathname}`);
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Add pathname to headers so we can access it in layouts
  response.headers.set('x-pathname', request.nextUrl.pathname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Updated protectedPaths to include organizations and data-types
  const protectedPaths = ["/", "/profiles", "/organizations", "/data-types"]

  // Handle i18n routing
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  // Skip ALL middleware logic for setup-password - let it load directly
  if (pathname.startsWith("/setup-password")) {
    console.log("Setup-password detected, skipping all middleware logic")
    return response
  }

  // If the pathname does not have a locale, redirect to the detected locale
  if (
    !pathnameHasLocale &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/login")
  ) {
    const locale = getLocale(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  // Handle authentication for protected paths
  const currentPathWithoutLocale = pathname.replace(`/${getLocale(request)}`, "") || "/"
  
  if (!session && protectedPaths.includes(currentPathWithoutLocale)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${getLocale(request)}/`
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based protection for /data-types
  if (session && currentPathWithoutLocale === "/data-types") {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || (profile.type !== "Administrator" && profile.type !== "Manager")) {
      console.warn(`Unauthorized access attempt to /data-types by user type: ${profile?.type || "unknown"}`)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `/${getLocale(request)}/` // Redirect to dashboard
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Organization selection logic for authenticated users - RE-ENABLED
  if (session && 
      currentPathWithoutLocale !== "/select-organization" && 
      !currentPathWithoutLocale.startsWith("/api/") &&
      !currentPathWithoutLocale.startsWith("/login") &&
      !currentPathWithoutLocale.startsWith("/setup-password")) {
    
    console.log(`MIDDLEWARE: Checking org for ${currentPathWithoutLocale}`);
    
    // Get user's organizations
    const { data: organizationProfiles, error: orgError } = await supabase
      .from("organization_profiles")
      .select(`
        organization_id,
        organizations (
          id,
          name
        )
      `)
      .eq("profile_id", session.user.id)

    if (!orgError && organizationProfiles && organizationProfiles.length > 0) {
      const organizations = organizationProfiles
        .map(op => op.organizations)
        .filter(org => org !== null) 
        .flat() as Array<{ id: string; name: string }>
      
      // Get current organization from cookie
      const currentOrganizationId = request.cookies.get("current-organization")?.value
      const currentOrganization = organizations.find(org => org.id === currentOrganizationId)

      console.log(`MIDDLEWARE: User ${session.user.email} has ${organizations.length} orgs, current: ${currentOrganization?.name || 'none'}`);

      // If user has multiple organizations but no valid current organization, redirect to select
      if (organizations.length > 1 && !currentOrganization) {
        console.log("MIDDLEWARE: Redirecting to select-organization")
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `/${getLocale(request)}/select-organization`
        return NextResponse.redirect(redirectUrl)
      }

      // If user has only one organization and no current org set, set it automatically
      if (organizations.length === 1 && !currentOrganization) {
        console.log("MIDDLEWARE: Setting single organization automatically:", organizations[0].name)
        response.cookies.set("current-organization", organizations[0].id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        })
      }
    } else {
      console.log("MIDDLEWARE: No organizations found or error:", orgError?.message || "No profiles")
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - any other public assets
     * - login (login page is handled separately)
     * - setup-password (password setup page is handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|login|setup-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
