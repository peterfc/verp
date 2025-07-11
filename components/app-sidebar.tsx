"use client"
import Link from "next/link"
import { SidebarMenuSubItem } from "@/components/ui/sidebar"

import { Users, BriefcaseBusiness, Home, LogOut, ChevronDown, FileText } from "lucide-react" // Import FileText
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useCallback } from "react" // Import useCallback
import type { User } from "@supabase/supabase-js"

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  useSidebar,
  SidebarMenuSkeleton, // Import SidebarMenuSkeleton
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DataType {
  id: string
  name: string
  organization_id: string
}

export function AppSidebar({ sidebarDict }: { sidebarDict: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const { isMobile, setOpenMobile } = useSidebar()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [dataTypes, setDataTypes] = useState<DataType[]>([])
  const [loadingDataTypes, setLoadingDataTypes] = useState(true)

  const currentLocale = pathname.split("/")[1] || "en"

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!supabase) return

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error("Error fetching user:", userError?.message)
        setCurrentUser(null)
        setIsAdmin(false)
        setIsManager(false)
        return
      }

      setCurrentUser(user)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("type")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile type:", profileError.message)
        setIsAdmin(false)
        setIsManager(false)
      } else if (profile) {
        setIsAdmin(profile.type === "Administrator")
        setIsManager(profile.type === "Manager")
      }
    }

    fetchUserRole()
  }, [supabase])

  const fetchDataTypes = useCallback(async () => {
    if (!supabase || !currentUser) {
      setLoadingDataTypes(false)
      return
    }
    setLoadingDataTypes(true)
    try {
      const response = await fetch("/api/data-types")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const ct = response.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        setDataTypes([])
        return
      }
      const data: DataType[] = await response.json()
      setDataTypes(data)
    } catch (err) {
      console.error("Error fetching data types for sidebar:", err)
      // Optionally toast an error, but might be too noisy for sidebar
    } finally {
      setLoadingDataTypes(false)
    }
  }, [supabase, currentUser])

  useEffect(() => {
    // Fetch data types for all authenticated users, as they might need to see them
    // nested under organizations.
    if (currentUser) {
      fetchDataTypes()
    } else {
      // If not logged in, clear data types
      setDataTypes([])
      setLoadingDataTypes(false)
    }
  }, [currentUser, fetchDataTypes])

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
      router.push("/login")
    }
  }

  const handleNavLinkClick = (url: string) => {
    if (isMobile) {
      setOpenMobile(false)
    }
    router.push(url)
  }

  // Helper to generate a simple slug from the data type name
  const generateSlug = (name: string) => {
    return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))
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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === `/${currentLocale}/`}
                    onClick={() => handleNavLinkClick(`/${currentLocale}/`)}
                  >
                    <div className="flex items-center gap-2">
                      <Home />
                      <span>{sidebarDict.dashboard}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      isAdmin || isManager
                        ? pathname === `/${currentLocale}/profiles`
                        : pathname === `/${currentLocale}/profiles/${currentUser?.id}/edit`
                    }
                    onClick={() =>
                      handleNavLinkClick(
                        isAdmin || isManager
                          ? `/${currentLocale}/profiles`
                          : `/${currentLocale}/profiles/${currentUser?.id}/edit`,
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Users />
                      <span>{isAdmin || isManager ? sidebarDict.profiles : sidebarDict.myProfile}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Organizations and nested Data Types */}
                <Collapsible
                  defaultOpen={
                    pathname.startsWith(`/${currentLocale}/organizations`) ||
                    pathname.startsWith(`/${currentLocale}/data-types`)
                  }
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname === `/${currentLocale}/organizations`}
                        // No direct onClick here, as the CollapsibleTrigger handles it
                      >
                        <div className="flex items-center gap-2">
                          <BriefcaseBusiness />
                          <span>{sidebarDict.organizations}</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === `/${currentLocale}/organizations`}
                          onClick={() => handleNavLinkClick(`/${currentLocale}/organizations`)}
                        >
                          <Link href={`/${currentLocale}/organizations`}>
                            <span>{sidebarDict.settings}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Data Types link for Admins/Managers, or individual data type links for regular users */}
                      {isAdmin || isManager ? (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/${currentLocale}/data-types`}
                            onClick={() => handleNavLinkClick(`/${currentLocale}/data-types`)}
                          >
                            <Link href={`/${currentLocale}/data-types`}>
                              <span>{sidebarDict.dataTypes}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : (
                        // For regular users, list individual data types directly under Organizations
                        <>
                          {loadingDataTypes ? (
                            <SidebarMenuSkeleton showIcon />
                          ) : dataTypes.length === 0 ? (
                            <SidebarMenuSubItem>
                              <span className="px-2 py-1 text-xs text-muted-foreground">
                                {sidebarDict.noDataTypesFound}
                              </span>
                            </SidebarMenuSubItem>
                          ) : (
                            dataTypes.map((dataType) => (
                              <SidebarMenuSubItem key={dataType.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={
                                    pathname ===
                                    `/${currentLocale}/data-types/${dataType.organization_id}/${dataType.id}/${generateSlug(dataType.name)}`
                                  }
                                  onClick={() =>
                                    handleNavLinkClick(
                                      `/${currentLocale}/data-types/${dataType.organization_id}/${dataType.id}/${generateSlug(dataType.name)}`,
                                    )
                                  }
                                >
                                  <Link
                                    href={`/${currentLocale}/data-types/${dataType.organization_id}/${dataType.id}/${generateSlug(dataType.name)}`}
                                  >
                                    <FileText className="h-4 w-4" /> {/* Add icon for individual data types */}
                                    <span>{dataType.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))
                          )}
                        </>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
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
