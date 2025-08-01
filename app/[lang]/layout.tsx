import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { OrganizationDropdown } from "@/components/organization-dropdown"
import { getDictionary } from "./dictionaries"
import { LanguageSwitcher } from "@/components/language-switcher"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/organization-utils"

const inter = Inter({ subsets: ["latin"] })

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }]
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ lang: "en" | "es" }>
}) {
  const { lang } = await params;
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  
  // Check if we're on special pages that need simple layout
  const isSetupPasswordPage = pathname.includes("/setup-password")
  const isSelectOrganizationPage = pathname.includes("/select-organization")
  
  // For setup-password and select-organization pages, render a simple layout without sidebar
  if (isSetupPasswordPage || isSelectOrganizationPage) {
    return <>{children}</>
  }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"
  const dict = await getDictionary(lang)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.name || user?.email || dict.layout.guest

  // Get organization information
  const { currentOrganization, userOrganizations, needsOrganizationSelection } = await getCurrentOrganization()

  // If user needs to select an organization, redirect them
  if (user && needsOrganizationSelection) {
    redirect(`/${lang}/select-organization`)
  }

  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar sidebarDict={dict.sidebar} />
        <SidebarInset>
          <main className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <CustomSidebarTrigger className="-ml-1">
                <span className="sr-only">{dict.layout.toggleSidebar}</span>
              </CustomSidebarTrigger>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-lg font-semibold">{dict.layout.dashboardTitle}</h1>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm font-medium">{userName}</span>
                {user && currentOrganization && (
                  <OrganizationDropdown
                    currentOrganization={currentOrganization}
                    userOrganizations={userOrganizations}
                    lang={lang}
                  />
                )}
                <LanguageSwitcher />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ lang: "en" | "es" }> }): Promise<Metadata> {
  const { lang } = await params // Access lang explicitly after receiving the full params object
  const dict = await getDictionary(lang)
  return {
    title: dict.layout.metadataTitle,
    description: dict.layout.metadataDescription,
  }
}
