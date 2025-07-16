import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { cookies } from "next/headers"
import { Separator } from "@/components/ui/separator"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getDictionary } from "./dictionaries"
import { LanguageSwitcher } from "@/components/language-switcher"
import { createServerClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"] })

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }]
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { lang: "en" | "es" }
}) {
  const { lang } = await params;
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"
  const dict = await getDictionary(lang)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.name || user?.email || dict.layout.guest

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

export async function generateMetadata({ params }: { params: { lang: "en" | "es" } }): Promise<Metadata> {
  const { lang } = await params // Access lang explicitly after receiving the full params object
  const dict = await getDictionary(lang)
  return {
    title: dict.layout.metadataTitle,
    description: dict.layout.metadataDescription,
  }
}
