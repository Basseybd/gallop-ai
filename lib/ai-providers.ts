// AI provider configurations using Vercel AI SDK
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";
import { generateText } from "ai";

export type AIModel = "openai" | "anthropic" | "gemini" | "perplexity";

interface AIProvider {
  model: any;
  name: string;
  available: boolean;
}

// Configure AI providers with environment variables
const providers: Record<AIModel, AIProvider> = {
  openai: {
    model: openai("gpt-4-turbo-preview"),
    name: "OpenAI GPT-4",
    available: !!process.env.OPENAI_API_KEY,
  },
  anthropic: {
    model: anthropic("claude-3-haiku-20240307"),
    name: "Anthropic Claude",
    available: !!process.env.ANTHROPIC_API_KEY,
  },
  gemini: {
    model: google("gemini-1.5-pro"),
    name: "Google Gemini",
    available: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  perplexity: {
    model: perplexity("llama-3.1-sonar-small-128k-online"),
    name: "Perplexity",
    available: !!process.env.PERPLEXITY_API_KEY,
  },
};

export async function queryAIModel(
  modelId: AIModel,
  prompt: string
): Promise<string> {
  const provider = providers[modelId];

  if (!provider.available) {
    throw new Error(`${provider.name} is not available - missing API key`);
  }

  try {
    const { text } = await generateText({
      model: provider.model,
      prompt,
      maxTokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent ranking
    });

    return text;
  } catch (error) {
    console.error(`Error querying ${provider.name}:`, error);
    throw new Error(
      `Failed to query ${provider.name}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function getAvailableProviders(): Array<{
  id: AIModel;
  name: string;
  available: boolean;
}> {
  return Object.entries(providers).map(([id, provider]) => ({
    id: id as AIModel,
    name: provider.name,
    available: provider.available,
  }));
}

export function generateRankingPrompt(
  question: string,
  customOptions?: string[],
  date?: string
): string {
  const dateContext = date ? ` as of ${date}` : " as of the current time";
  const optionsContext = customOptions?.length
    ? `\n\nSpecific options to consider: ${customOptions.join(", ")}`
    : "";

  return `You are tasked with creating a ranking of the top 5 items based on this question: "${question}"${dateContext}.

Please provide exactly 5 items in a ranked list from #1 (best/most relevant) to #5. Consider factors like:
- Quality, performance, or effectiveness
- Popularity and reputation  
- Innovation and uniqueness
- Value and accessibility
- Current relevance and trends

Format your response as a simple numbered list:
1. [Item name]
2. [Item name]
3. [Item name]
4. [Item name]
5. [Item name]

Do not include explanations, just the ranked list.${optionsContext}`;
}
