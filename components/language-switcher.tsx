"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locales = ["en", "es"] // Define your supported locales

  const currentLocale = pathname.split("/")[1] // Assumes /locale/path

  const handleLocaleChange = (newLocale: string) => {
    const newPath = `/${newLocale}${pathname.substring(currentLocale.length + 1)}`
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => handleLocaleChange(locale)}>
            {locale === "en" ? "English" : "Español"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
