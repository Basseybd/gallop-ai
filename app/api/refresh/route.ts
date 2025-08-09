import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Revalidate the homepage to trigger fresh LLM API calls
    revalidatePath("/")

    return NextResponse.json({
      message: "Revalidation triggered successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to trigger revalidation" }, { status: 500 })
  }
}
