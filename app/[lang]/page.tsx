import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDictionary } from "./dictionaries" // Import dictionary
import { cookies } from "next/headers" // Import cookies
import { createServerClient } from "@/lib/supabase/server" // Import server client

export default async function HomePage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const dict = await getDictionary(lang) // Fetch dictionary

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let isManager = false

  if (user) {
    const { data: profile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
    if (error) {
      console.error("Error fetching user profile type:", error)
    } else if (profile) {
      isAdmin = profile.type === "Administrator"
      isManager = profile.type === "Manager"
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{dict.homePage.welcomeTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">{dict.homePage.welcomeDescription}</p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/profiles`}>{dict.homePage.manageProfiles}</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href={`/${lang}/organizations`}>{dict.homePage.manageOrganizations}</Link>
            </Button>
            {(isAdmin || isManager) && (
              <Button asChild className="w-full">
                <Link href={`/${lang}/data-types`}>{dict.homePage.manageDataTypes}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
