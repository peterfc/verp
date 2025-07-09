import { NextResponse } from "next/server"
import { getDictionary } from "../../../../[lang]/dictionaries"

export async function GET(request: Request, { params }: { params: { lang: "en" | "es" } }) {
  const { lang } = params
  try {
    const dict = await getDictionary(lang)
    // Return only the parts of the dictionary relevant to the customers page
    return NextResponse.json({
      customersPage: dict.customersPage,
      customerForm: dict.customerForm,
      multiSelectProfiles: dict.multiSelectProfiles,
      common: dict.common,
    })
  } catch (error) {
    console.error("Error fetching customers dictionary:", error)
    return NextResponse.json({ error: "Failed to load dictionary" }, { status: 500 })
  }
}
