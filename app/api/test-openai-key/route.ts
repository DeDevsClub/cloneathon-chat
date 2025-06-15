import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Test the API key with a minimal request to OpenAI
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.error?.message || "Invalid API key" }, { status: 401 })
    }

    // If we get here, the key is valid
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error testing OpenAI API key:", error)
    return NextResponse.json({ error: "Failed to validate API key" }, { status: 500 })
  }
}

