export type Model = "openai" | "anthropic" | "perplexity" | "gemini" | "mistral"

export interface CustomTrend {
  id: string
  request: any // Replace 'any' with a more specific type if possible
  rankings: any[] // Replace 'any[]' with a more specific type if possible
  trendData: any[] // Replace 'any[]' with a more specific type if possible
  historicalData?: any[] // Replace 'any[]' with a more specific type if possible
}
