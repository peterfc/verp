"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AutoRedirectProps {
  organizationId: string
  lang: string
}

export function AutoRedirect({ organizationId, lang }: AutoRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    // Set the organization cookie on the client side
    const setOrganizationAndRedirect = async () => {
      try {
        const response = await fetch("/api/set-organization", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ organizationId }),
        })

        if (response.ok) {
          router.push(`/${lang}`)
        } else {
          console.error("Failed to set organization")
        }
      } catch (error) {
        console.error("Error setting organization:", error)
      }
    }

    setOrganizationAndRedirect()
  }, [organizationId, lang, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Setting up your organization...</p>
      </div>
    </div>
  )
}
