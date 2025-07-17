import { NextResponse } from "next/server"
import { getDictionary } from "../../../../[lang]/dictionaries"

export async function GET(request: Request, { params }: { params: Promise<{ lang: "en" | "es" }> }) {
  const { lang } = await params
  try {
    const dict = await getDictionary(lang)
    return NextResponse.json({
      dataTypesPage: dict.dataTypesPage,
      dataTypeForm: dict.dataTypeForm,
      dataTypeEditor: dict.dataTypeEditor,
      common: dict.common,
    })
  } catch (error) {
    console.error("Error fetching data types dictionary:", error)
    return NextResponse.json({ error: "Failed to load dictionary" }, { status: 500 })
  }
}
