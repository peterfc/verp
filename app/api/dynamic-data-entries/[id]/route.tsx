import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"

const routeContextSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
})

export async function PUT(request: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    // Validate route params.
    const { params } = routeContextSchema.parse(context)

    // Parse JSON body - returns the object directly
    const body = await request.json()

    console.log("[SERVER] Raw request body:", JSON.stringify(body, null, 2))

    // Validate payload
    if (!body || typeof body !== "object" || body.data === undefined) {
      return NextResponse.json({ error: "Missing or invalid 'data' field in request body" }, { status: 400 })
    }

    console.log("[SERVER] PUT request body:", body)

    // Update the dynamic data entry.
    const dynamicDataEntry = await db.dynamicDataEntry.update({
      where: {
        id: params.id,
      },
      data: {
        data: body.data,
      },
    })

    console.log("[SERVER] Updated dynamic data entry:", dynamicDataEntry)

    // Return the updated dynamic data entry.
    return NextResponse.json(dynamicDataEntry)
  } catch (error) {
    console.error("[SERVER] Error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
