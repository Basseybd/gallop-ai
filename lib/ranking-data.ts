// Mock ranking data generator for demonstration
export interface RankingItem {
  name: string
  openaiRank: number
  anthropicRank: number
  change?: "up" | "down" | "same"
}

export interface TrendData {
  date: string
  formattedDate: string
  openai: number
  anthropic: number
}

// Generate dates for the past year
function generateDates(count: number): string[] {
  const dates = []
  const now = new Date()

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(now.getMonth() - i)
    dates.push(date.toISOString())
  }

  return dates
}

// Format dates for display
function formatDates(dates: string[]): string[] {
  return dates.map((dateStr) => {
    const date = new Date(dateStr)
    return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
  })
}

// Generate trend data with proper dates
function generateTrendData(dates: string[], formattedDates: string[]): TrendData[] {
  return dates.map((date, index) => ({
    date,
    formattedDate: formattedDates[index],
    openai: Math.floor(Math.random() * 5) + 1,
    anthropic: Math.floor(Math.random() * 5) + 1,
  }))
}

// Generate dates for the past year (12 months)
const dates = generateDates(12)
const formattedDates = formatDates(dates)

export const sampleRankingData = {
  "burger-sf": {
    rankings: [
      { name: "In-N-Out Burger", openaiRank: 1, anthropicRank: 2, change: "up" as const },
      { name: "Super Duper Burgers", openaiRank: 2, anthropicRank: 1, change: "down" as const },
      { name: "Shake Shack", openaiRank: 3, anthropicRank: 4, change: "same" as const },
      { name: "The Habit Burger", openaiRank: 4, anthropicRank: 3, change: "up" as const },
      { name: "Umami Burger", openaiRank: 5, anthropicRank: 5, change: "same" as const },
    ],
    trendData: generateTrendData(dates, formattedDates),
  },
  "ai-companies": {
    rankings: [
      { name: "OpenAI", openaiRank: 1, anthropicRank: 2, change: "same" as const },
      { name: "Anthropic", openaiRank: 2, anthropicRank: 1, change: "up" as const },
      { name: "Google DeepMind", openaiRank: 3, anthropicRank: 3, change: "same" as const },
      { name: "Meta AI", openaiRank: 4, anthropicRank: 4, change: "down" as const },
      { name: "Mistral AI", openaiRank: 5, anthropicRank: 5, change: "up" as const },
    ],
    trendData: generateTrendData(dates, formattedDates),
  },
  "programming-languages": {
    rankings: [
      { name: "TypeScript", openaiRank: 1, anthropicRank: 1, change: "same" as const },
      { name: "Python", openaiRank: 2, anthropicRank: 2, change: "same" as const },
      { name: "Rust", openaiRank: 3, anthropicRank: 4, change: "up" as const },
      { name: "Go", openaiRank: 4, anthropicRank: 3, change: "down" as const },
      { name: "JavaScript", openaiRank: 5, anthropicRank: 5, change: "same" as const },
    ],
    trendData: generateTrendData(dates, formattedDates),
  },
}

export function getRankingData(questionId: string) {
  return sampleRankingData[questionId as keyof typeof sampleRankingData] || sampleRankingData["burger-sf"]
}
