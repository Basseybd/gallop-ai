import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, model, apiKey } = await request.json()

    if (!question || !model || !apiKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Sanitize API key to ensure it only contains valid characters
    const sanitizedApiKey = apiKey.trim().replace(/[^\x00-\x7F]/g, "")
    if (!sanitizedApiKey) {
      return NextResponse.json({ error: "Invalid API key format" }, { status: 400 })
    }

    const isValid = await validateQuestionWithLLM(question, model, sanitizedApiKey)

    return NextResponse.json({ isValid })
  } catch (error) {
    console.error("Request validation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

async function validateQuestionWithLLM(question: string, model: string, apiKey: string): Promise<boolean> {
  const validationPrompt = `Analyze the following question and determine if it's suitable for ranking analysis:

Question: "${question}"

A question is suitable for ranking if:
1. It asks for comparison or ranking of multiple items/options
2. The items can be meaningfully compared or ranked
3. There are likely to be multiple valid answers that could be ranked
4. The question is specific enough to generate meaningful rankings
5. It's not asking for factual information that has only one correct answer

Examples of SUITABLE questions:
- "Best burger in NYC"
- "Top programming languages for startups"
- "Most innovative tech companies"

Examples of UNSUITABLE questions:
- "What is 2+2?" (factual, single answer)
- "When was the iPhone released?" (factual, single answer)
- "How do I tie my shoes?" (instructional, not rankable)
- "What color is the sky?" (factual, single answer)

Respond with only "VALID" or "INVALID" - no explanation needed.`

  try {
    switch (model) {
      case "openai":
        return await validateWithOpenAI(validationPrompt, apiKey)
      case "anthropic":
        return await validateWithAnthropic(validationPrompt, apiKey)
      default:
        // For other models, use OpenAI as fallback or return true
        return true
    }
  } catch (error) {
    console.error("LLM validation error:", error)
    // If validation fails, allow the request to proceed
    return true
  }
}

async function validateWithOpenAI(prompt: string, apiKey: string): Promise<boolean> {
  // Ensure prompt is properly encoded
  const encodedPrompt = encodeURIComponent(prompt)
  const decodedPrompt = decodeURIComponent(encodedPrompt)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: decodedPrompt,
        },
      ],
      max_tokens: 10,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const result = data.choices[0]?.message?.content?.trim().toUpperCase()
  return result === "VALID"
}

async function validateWithAnthropic(prompt: string, apiKey: string): Promise<boolean> {
  // Ensure prompt is properly encoded
  const encodedPrompt = encodeURIComponent(prompt)
  const decodedPrompt = decodeURIComponent(encodedPrompt)

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: decodedPrompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const result = data.content[0]?.text?.trim().toUpperCase()
  return result === "VALID"
}
