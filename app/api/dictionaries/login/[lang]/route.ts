import { NextResponse } from "next/server"
// Depth: route.ts → [lang] → login → dictionaries → api → app  (4 levels up)
import { getDictionary } from "../../../../[lang]/dictionaries"

export async function GET(request: Request, { params }: { params: { lang: "en" | "es" } }) {
  const { lang } = params
  try {
    const dict = await getDictionary(lang)
    // We only need the loginPage and common parts for the login page
    return NextResponse.json({
      loginPage: dict.loginPage,
      common: dict.common,
    })
  } catch (error) {
    console.error("Error fetching login dictionary:", error)
    return NextResponse.json({ error: "Failed to load dictionary" }, { status: 500 })
  }
}
