"use client"
import Link from "next/link"
import { Users, BriefcaseBusiness, Home, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation" // Keep usePathname for current path logic
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ sidebarDict }: { sidebarDict: any }) {
  const router = useRouter()
  const pathname = usePathname() // Use usePathname for consistent path on server and client
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const { isMobile, setOpenMobile } = useSidebar()

  // Extract current locale from pathname
  const currentLocale = pathname.split("/")[1] || "en"

  const navItems = [
    {
      title: sidebarDict.dashboard,
      url: `/${currentLocale}/`,
      icon: Home,
    },
    {
      title: sidebarDict.profiles,
      url: `/${currentLocale}/profiles`,
      icon: Users,
    },
    {
      title: sidebarDict.customers,
      url: `/${currentLocale}/customers`,
      icon: BriefcaseBusiness,
    },
  ]

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: sidebarDict.logoutFailed,
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: sidebarDict.loggedOut,
        description: sidebarDict.loggedOutDescription,
      })
      router.push("/login") // Redirect to non-locale prefixed login page
    }
  }

  const handleNavLinkClick = (url: string) => {
    if (isMobile) {
      setOpenMobile(false)
    }
    router.push(url)
  }

  return (
    <Sidebar>
      <>
        <SidebarHeader>
          <Link href={`/${currentLocale}/`} className="flex items-center gap-2 font-semibold text-lg">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-6 w-6" />
              <span>{sidebarDict.appName}</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{sidebarDict.navigation}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={pathname === item.url} onClick={() => handleNavLinkClick(item.url)}>
                      <div className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                    <div className="flex items-center gap-2">
                      <LogOut />
                      <span>{sidebarDict.logout}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </>
    </Sidebar>
  )
}
