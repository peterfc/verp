"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient() // This can now be null
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null) // State to hold dictionary
  const [isSupabaseReady, setIsSupabaseReady] = useState(false)

  useEffect(() => {
    const loadDict = async () => {
      const pathParts = pathname.split("/")
      // Handle direct /login access (without language prefix)
      const currentLocale = (pathParts[1] && ["en", "es"].includes(pathParts[1]) ? pathParts[1] : "en") as "en" | "es"
      try {
        const response = await fetch(`/api/dictionaries/login/${currentLocale}`)
        if (!response.ok) {
          throw new Error("Failed to fetch login dictionary")
        }
        const data = await response.json()
        setDict(data)
      } catch (error) {
        console.error(error)
        setDict({
          loginPage: {
            title: "Login or Sign Up",
            description: "Enter your email and password to access the CRM app.",
            email: "Email",
            password: "Password",
            login: "Login",
            signUp: "Sign Up",
            loginFailed: "Login Failed",
            loginSuccessful: "Login Successful",
            redirecting: "Redirecting to dashboard...",
            signUpFailed: "Sign Up Failed",
            signUpSuccessful: "Sign Up Successful",
            confirmEmail: "Please check your email to confirm your account.",
          },
          common: {
            loading: "Loading...",
          },
        })
      }
    }
    loadDict()
  }, [pathname])

  useEffect(() => {
    // Check if supabase client is ready
    if (supabase) {
      setIsSupabaseReady(true)
    } else {
      setIsSupabaseReady(false)
      toast({
        title: "Configuration Error",
        description: "Supabase environment variables are not set. Login/Signup functionality is disabled.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }, [supabase, toast])

  useEffect(() => {
    // Check for password setup success
    const passwordSetupSuccess = searchParams.get("passwordSetup")
    if (passwordSetupSuccess === "success" && dict) {
      toast({
        title: "Password Set Successfully",
        description: "Your password has been set. You can now log in with your new credentials.",
        duration: 6000,
      })
    }
  }, [searchParams, dict, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized. Cannot log in.",
        variant: "destructive",
      })
      return
    }
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
      const redirectedFrom = searchParams.get("redirectedFrom")

      let targetLocale = "en"
      if (redirectedFrom) {
        const parts = redirectedFrom.split("/")
        if (parts.length > 1 && (parts[1] === "en" || parts[1] === "es")) {
          targetLocale = parts[1]
        }
      }
      router.push(`/${targetLocale}/`)
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized. Cannot sign up.",
        variant: "destructive",
      })
      return
    }
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

  if (!dict) return null

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
                disabled={!isSupabaseReady || loading}
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
                disabled={!isSupabaseReady || loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!isSupabaseReady || loading}>
              {loading ? dict.common.loading : dict.loginPage.login}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleSignUp}
              disabled={!isSupabaseReady || loading}
            >
              {loading ? dict.common.loading : dict.loginPage.signUp}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
