import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cookies } from "next/headers"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger" // Reintroduce CustomSidebarTrigger
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar" // Reintroduce SidebarProvider and SidebarInset
import { AppSidebar } from "@/components/app-sidebar" // Reintroduce AppSidebar

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Customer & User Management",
  description: "A modern web app to manage customers and users.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider defaultOpen={defaultOpen}>
          {" "}
          {/* Reintroduce SidebarProvider */}
          <AppSidebar /> {/* Reintroduce AppSidebar */}
          <SidebarInset>
            {" "}
            {/* Reintroduce SidebarInset */}
            <main className="flex flex-1 flex-col">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <CustomSidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h1 className="text-lg font-semibold">Dashboard</h1>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  )
}
