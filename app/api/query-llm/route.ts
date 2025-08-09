import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { model, prompts, apiKey, batchSize = 3 } = await request.json()

    if (!model || !prompts || !Array.isArray(prompts) || !apiKey) {
      return NextResponse.json({ error: "Missing required parameters or invalid prompts array" }, { status: 400 })
    }

    // Sanitize API key to ensure it only contains valid characters
    const sanitizedApiKey = apiKey.trim().replace(/[^\x00-\x7F]/g, "")
    if (!sanitizedApiKey) {
      return NextResponse.json({ error: "Invalid API key format" }, { status: 400 })
    }

    const responses: Record<string, string> = {}

    // Process prompts in batches to stay under token limits
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)

      try {
        const batchResponse = await queryLLMBatch(model, batch, sanitizedApiKey)

        // Parse batch response and assign to individual prompts
        const parsedResponses = parseBatchResponse(batchResponse, batch)
        Object.assign(responses, parsedResponses)

        // Add small delay between batches to respect rate limits
        if (i + batchSize < prompts.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Batch ${i}-${i + batchSize} failed:`, error)
        // Mark failed prompts
        batch.forEach((prompt) => {
          responses[prompt.id] = "Error: Unable to fetch response"
        })
      }
    }

    return NextResponse.json({ responses })
  } catch (error) {
    console.error("LLM batch query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

async function queryLLMBatch(model: string, prompts: any[], apiKey: string): Promise<string> {
  const batchPrompt = createBatchPrompt(prompts)

  switch (model) {
    case "openai":
      return await queryOpenAIBatch(batchPrompt, apiKey)
    case "anthropic":
      return await queryAnthropicBatch(batchPrompt, apiKey)
    case "perplexity":
      return await queryPerplexityBatch(batchPrompt, apiKey)
    case "gemini":
      return await queryGeminiBatch(batchPrompt, apiKey)
    case "mistral":
      return await queryMistralBatch(batchPrompt, apiKey)
    default:
      throw new Error(`Unsupported model: ${model}`)
  }
}

function createBatchPrompt(prompts: any[]): string {
  const question = prompts[0].question
  const months = prompts.map((p) => p.monthYear).join("\n\n")

  return `List the top 5 best ${question.toLowerCase()} for each month below:

${months}

Respond with exactly 5 items per month, numbered 1–5. Format:

January 2020
1. [Item Name]
2. [Item Name]
3. [Item Name]
4. [Item Name]
5. [Item Name]

February 2020
1. [Item Name]
2. [Item Name]
3. [Item Name]
4. [Item Name]
5. [Item Name]

Be concise and specific with item names only.`
}

function parseBatchResponse(response: string, prompts: any[]): Record<string, string> {
  const results: Record<string, string> = {}
  const lines = response.split("\n").filter((line) => line.trim())

  prompts.forEach((prompt) => {
    const monthYear = prompt.monthYear
    let topItem = ""

    // Find the month section and extract the #1 item
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Check if this line contains the month/year
      if (line.toLowerCase().includes(monthYear.toLowerCase())) {
        // Look for the next line that starts with "1."
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim()
          const match = nextLine.match(/^1\.\s*(.+)/)
          if (match && match[1]) {
            topItem = match[1].trim()
            break
          }
          // Stop if we hit another month or numbered list
          if (
            nextLine.match(
              /^(January|February|March|April|May|June|July|August|September|October|November|December)/i,
            ) ||
            nextLine.match(/^\d+\./)
          ) {
            break
          }
        }
        break
      }
    }

    // Store only the #1 item
    results[prompt.id] = topItem || "No result found"
  })

  return results
}

async function queryOpenAIBatch(prompt: string, apiKey: string): Promise<string> {
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
          role: "system",
          content:
            "You are a helpful assistant. Provide concise, structured responses in the exact format requested. List exactly 5 items per month, numbered 1-5.",
        },
        {
          role: "user",
          content: decodedPrompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || "No response available"
}

async function queryAnthropicBatch(prompt: string, apiKey: string): Promise<string> {
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
      max_tokens: 500,
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
  return data.content[0]?.text || "No response available"
}

// Placeholder implementations for other models with batch support
async function queryPerplexityBatch(prompt: string, apiKey: string): Promise<string> {
  // Mock response for demonstration
  const lines = prompt
    .split("\n")
    .filter((line) =>
      line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i),
    )

  return lines
    .map(
      (line) =>
        `${line}\n1. Perplexity Burger Co\n2. Perplexity Grill\n3. Perplexity Kitchen\n4. Perplexity Diner\n5. Perplexity Cafe`,
    )
    .join("\n\n")
}

async function queryGeminiBatch(prompt: string, apiKey: string): Promise<string> {
  // Mock response for demonstration
  const lines = prompt
    .split("\n")
    .filter((line) =>
      line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i),
    )

  return lines
    .map((line) => `${line}\n1. Gemini Grill\n2. Gemini Burgers\n3. Gemini Kitchen\n4. Gemini Diner\n5. Gemini Cafe`)
    .join("\n\n")
}

async function queryMistralBatch(prompt: string, apiKey: string): Promise<string> {
  // Mock response for demonstration
  const lines = prompt
    .split("\n")
    .filter((line) =>
      line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i),
    )

  return lines
    .map(
      (line) => `${line}\n1. Mistral Burgers\n2. Mistral Grill\n3. Mistral Kitchen\n4. Mistral Diner\n5. Mistral Cafe`,
    )
    .join("\n\n")
}
