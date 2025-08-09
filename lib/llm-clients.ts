// Server-side only OpenAI client
let openaiClient: any = null

async function getOpenAIClient() {
  if (!openaiClient && typeof window === "undefined") {
    // Only import and initialize on server-side
    const { default: OpenAI } = await import("openai")
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// Mock Anthropic responses (you can add ANTHROPIC_API_KEY later)
const mockAnthropicResponses = {
  "burger-sf":
    "While In-N-Out is popular, I'd recommend Super Duper Burgers for their locally-sourced ingredients and creative combinations. Their classic burger with garlic aioli and their sweet potato fries offer a more artisanal take on the classic American burger.",
  "ai-risk":
    "AI development should proceed cautiously with robust safety research. The potential for misalignment between AI goals and human values is a serious concern that requires proactive measures, international cooperation, and continued research into AI safety and control mechanisms.",
  "climate-change":
    "Climate action demands immediate, coordinated global effort. We need aggressive decarbonization, massive investment in clean technology, adaptation strategies for vulnerable communities, and fundamental changes to economic systems that prioritize sustainability over short-term growth.",
  "remote-work":
    "Remote work has proven effective for many roles, offering reduced commute stress and increased productivity for focused tasks. However, in-person collaboration remains valuable for creative work, mentorship, and building relationships. A flexible, trust-based approach works best.",
  "social-media":
    "Research shows social media can negatively impact mental health through comparison, cyberbullying, and addictive design patterns. However, it also offers community and support for marginalized groups. The key is developing digital literacy and healthy usage habits.",
  "space-exploration":
    "While space exploration yields valuable scientific knowledge and technological advancement, the urgent crises on Earth—climate change, poverty, disease—require immediate attention and resources. We should prioritize solving terrestrial challenges while maintaining modest space research.",
}

async function getOpenAIResponse(prompt: string): Promise<string> {
  // Ensure we're running server-side
  if (typeof window !== "undefined") {
    return "OpenAI API can only be called server-side"
  }

  try {
    const client = await getOpenAIClient()
    if (!client) {
      return "OpenAI client not available"
    }

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide thoughtful, balanced responses in 2-3 sentences. Be concise but informative.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      max_tokens: 150,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "No response available"
  } catch (error) {
    console.error("OpenAI API error:", error)
    return "Unable to fetch OpenAI response at this time."
  }
}

function getAnthropicResponse(question: string): string {
  // Find matching response based on question keywords
  const questionLower = question.toLowerCase()

  if (questionLower.includes("burger") || questionLower.includes("sf")) {
    return mockAnthropicResponses["burger-sf"]
  } else if (questionLower.includes("ai") && questionLower.includes("risk")) {
    return mockAnthropicResponses["ai-risk"]
  } else if (questionLower.includes("climate")) {
    return mockAnthropicResponses["climate-change"]
  } else if (questionLower.includes("remote") || questionLower.includes("work")) {
    return mockAnthropicResponses["remote-work"]
  } else if (questionLower.includes("social") || questionLower.includes("media")) {
    return mockAnthropicResponses["social-media"]
  } else if (questionLower.includes("space")) {
    return mockAnthropicResponses["space-exploration"]
  }

  return "I appreciate this thoughtful question. There are several important factors to consider when approaching this topic."
}

export async function getAllPromptResponses(question: string) {
  try {
    // Get responses from both models
    const [openaiResponse, anthropicResponse] = await Promise.all([
      getOpenAIResponse(question),
      Promise.resolve(getAnthropicResponse(question)),
    ])

    return {
      openai: openaiResponse,
      anthropic: anthropicResponse,
    }
  } catch (error) {
    console.error("Error fetching LLM responses:", error)
    return {
      openai: "Error fetching OpenAI response",
      anthropic: "Error fetching Anthropic response",
      error: "Failed to fetch responses",
    }
  }
}
