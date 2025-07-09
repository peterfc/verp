"use client"
import Link from "next/link"
import { Users, BriefcaseBusiness, Home, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation" // Import usePathname
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

export function AppSidebar() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const pathname = usePathname() // Use usePathname for consistent path on server and client
  const { isMobile, setOpenMobile } = useSidebar()

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Profiles",
      url: "/profiles",
      icon: Users,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: BriefcaseBusiness,
    },
  ]

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
      router.push("/login")
    }
  }

  const handleNavLinkClick = (url: string) => {
    if (isMobile) {
      setOpenMobile(false) // Close the sidebar on mobile first
    }
    router.push(url) // Then navigate
  }

  return (
    <Sidebar>
      <>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-6 w-6" />
              <span>CRM App</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                      <span>Logout</span>
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
