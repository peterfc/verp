import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import Negotiator from "negotiator" // [^1][^2]
import { match } from "@formatjs/intl-localematcher" // [^1][^2]

const locales = ["en", "es"] // Supported locales
const defaultLocale = "en" // Default locale [^1][^2]

function getLocale(request: NextRequest) {
  const acceptLanguageHeader = request.headers.get("accept-language")
  const languages = new Negotiator({ headers: { "accept-language": acceptLanguageHeader || "" } }).languages()
  return match(languages, locales, defaultLocale) // [^1][^2]
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  const protectedPaths = ["/", "/profiles", "/customers"] // Paths that require authentication

  // Handle i18n routing [^1][^2]
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

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
  if (!session && protectedPaths.includes(request.nextUrl.pathname.replace(`/${getLocale(request)}`, ""))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${getLocale(request)}/` // Redirect to locale-prefixed dashboard
    return NextResponse.redirect(redirectUrl)
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
     */
    "/((?!_next/static|_next/image|favicon.ico|api|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
