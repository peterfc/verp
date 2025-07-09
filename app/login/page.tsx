"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation" // Import usePathname
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Client-side dictionary for the login page
const loginDictionaries = {
  en: () => import("../[lang]/dictionaries/en.json").then((module) => module.default),
  es: () => import("../[lang]/dictionaries/es.json").then((module) => module.default),
}

const getLoginDictionary = async (locale: "en" | "es") => loginDictionaries[locale]?.() ?? loginDictionaries.en()

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname() // Get current pathname
  const searchParams = useSearchParams() // Call useSearchParams at the top level
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null) // State to hold dictionary

  useEffect(() => {
    const loadDict = async () => {
      // Extract locale from pathname, default to 'en' if not present
      const currentLocale = (pathname.split("/")[1] || "en") as "en" | "es"
      setDict(await getLoginDictionary(currentLocale))
    }
    loadDict()
  }, [pathname])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: dict?.loginPage.loginFailed || "Login Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: dict?.loginPage.loginSuccessful || "Login Successful",
        description: dict?.loginPage.redirecting || "Redirecting to dashboard...",
      })
      // Determine the target locale for redirection
      const redirectedFrom = searchParams.get("redirectedFrom")

      let targetLocale = "en" // Default locale
      if (redirectedFrom) {
        // Extract locale from the redirectedFrom path, e.g., "/en/profiles" -> "en"
        const parts = redirectedFrom.split("/")
        if (parts.length > 1 && (parts[1] === "en" || parts[1] === "es")) {
          // Ensure it's a valid locale
          targetLocale = parts[1]
        }
      }
      router.push(`/${targetLocale}/`)
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: email.split("@")[0],
        },
      },
    })

    if (error) {
      toast({
        title: dict?.loginPage.signUpFailed || "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      })
    } else if (data.user) {
      toast({
        title: dict?.loginPage.signUpSuccessful || "Sign Up Successful",
        description:
          dict?.loginPage.confirmEmail ||
          "Please check your email to confirm your account (if email confirmation is enabled).",
      })
    }
    setLoading(false)
  }

  if (!dict) return null // Don't render until dictionary is loaded

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{dict.loginPage.title}</CardTitle>
          <CardDescription>{dict.loginPage.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{dict.loginPage.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{dict.loginPage.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? dict.common.loading : dict.loginPage.login}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? dict.common.loading : dict.loginPage.signUp}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
