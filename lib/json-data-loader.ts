// Load ranking data from JSON files in data directory
import claudeData from '@/data/claude.json'
import geminiData from '@/data/gemini.json'
import openaiData from '@/data/openai.json'
import perplexityData from '@/data/perplexity.json'

interface ModelRankingData {
  id: string
  category: string
  question: string
  dataEnds: string
  modelRankings: {
    [modelName: string]: {
      [date: string]: string[]
    }
  }
}

// Combine all JSON data
const allModelData = {
  Claude: claudeData,
  Gemini: geminiData,
  OpenAI: openaiData,
  Perplexity: perplexityData,
}

// Generate dates for the past year (12 months)
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

// Convert JSON data to the format expected by RankingCard
export function getJsonRankingData(questionId: string) {
  // Find the question data across all models
  const questionData: { [modelName: string]: ModelRankingData } = {}
  
  Object.entries(allModelData).forEach(([modelName, modelDataArray]) => {
    const foundData = modelDataArray.find(item => item.id === questionId)
    if (foundData) {
      questionData[modelName] = foundData
    }
  })

  if (Object.keys(questionData).length === 0) {
    // Return default data if question not found
    return getDefaultRankingData()
  }

  // Get the first model's data to extract basic info
  const firstModelData = Object.values(questionData)[0]
  const question = firstModelData.question
  const category = firstModelData.category

  // Generate dates and formatted dates
  const dates = generateDates(12)
  const formattedDates = formatDates(dates)

  // Build combined rankings from all models
  const combinedRankings: any[] = []
  const itemPositions: { [itemName: string]: { [modelName: string]: number } } = {}

  // Collect all unique items and their positions across models
  Object.entries(questionData).forEach(([modelName, data]) => {
    const modelKey = Object.keys(data.modelRankings)[0] // Get the model name from the data
    const latestDate = Object.keys(data.modelRankings[modelKey]).slice(-1)[0]
    const rankings = data.modelRankings[modelKey][latestDate]

    rankings.forEach((itemName, index) => {
      if (!itemPositions[itemName]) {
        itemPositions[itemName] = {}
      }
      itemPositions[itemName][modelName.toLowerCase()] = index + 1
    })
  })

  // Create ranking items
  Object.entries(itemPositions).forEach(([itemName, modelRanks]) => {
    const rankingItem: any = {
      name: itemName,
      change: "same" as const
    }

    // Add ranks for each model
    if (modelRanks.claude) rankingItem.anthropicRank = modelRanks.claude
    if (modelRanks.openai) rankingItem.openaiRank = modelRanks.openai
    if (modelRanks.gemini) rankingItem.geminiRank = modelRanks.gemini
    if (modelRanks.perplexity) rankingItem.perplexityRank = modelRanks.perplexity

    combinedRankings.push(rankingItem)
  })

  // Sort by average rank across all models (with penalty for missing models)
  combinedRankings.sort((a, b) => {
    const aRanks = Object.values(a).filter(v => typeof v === 'number' && v > 0) as number[]
    const bRanks = Object.values(b).filter(v => typeof v === 'number' && v > 0) as number[]
    
    // Calculate average rank with penalty for missing models
    const totalModels = Object.keys(questionData).length
    const aAverage = aRanks.length > 0 ? (aRanks.reduce((sum, rank) => sum + rank, 0) + (totalModels - aRanks.length) * 6) / totalModels : 6
    const bAverage = bRanks.length > 0 ? (bRanks.reduce((sum, rank) => sum + rank, 0) + (totalModels - bRanks.length) * 6) / totalModels : 6
    
    return aAverage - bAverage
  })

  // Generate trend data
  const trendData = dates.map((date, index) => {
    const trendPoint: any = {
      date,
      formattedDate: formattedDates[index]
    }

    // For each item, add trend data points for each model
    combinedRankings.slice(0, 5).forEach((item) => {
      Object.entries(questionData).forEach(([modelName, data]) => {
        const modelKey = Object.keys(data.modelRankings)[0]
        const dateKey = Object.keys(data.modelRankings[modelKey])[Math.min(index, Object.keys(data.modelRankings[modelKey]).length - 1)]
        const rankings = data.modelRankings[modelKey][dateKey]
        const rank = rankings.findIndex(name => name === item.name) + 1
        
        if (rank > 0) {
          trendPoint[`${item.name}_${modelName.toLowerCase()}`] = rank
        }
      })
    })

    return trendPoint
  })

  return {
    question,
    category,
    rankings: combinedRankings,
    trendData
  }
}

// Fallback default data
function getDefaultRankingData() {
  const dates = generateDates(12)
  const formattedDates = formatDates(dates)

  return {
    question: "Sample Question",
    category: "General",
    rankings: [
      { name: "Sample Item 1", openaiRank: 1, anthropicRank: 2, change: "up" as const },
      { name: "Sample Item 2", openaiRank: 2, anthropicRank: 1, change: "down" as const },
      { name: "Sample Item 3", openaiRank: 3, anthropicRank: 3, change: "same" as const },
    ],
    trendData: dates.map((date, index) => ({
      date,
      formattedDate: formattedDates[index],
      'Sample Item 1_openai': Math.floor(Math.random() * 3) + 1,
      'Sample Item 1_anthropic': Math.floor(Math.random() * 3) + 1,
      'Sample Item 2_openai': Math.floor(Math.random() * 3) + 1,
      'Sample Item 2_anthropic': Math.floor(Math.random() * 3) + 1,
      'Sample Item 3_openai': Math.floor(Math.random() * 3) + 1,
      'Sample Item 3_anthropic': Math.floor(Math.random() * 3) + 1,
    }))
  }
}

// Get all available questions from JSON data
export function getAvailableQuestions() {
  const questions: { id: string; question: string; category: string }[] = []
  
  // Use Claude data as the source of truth for available questions
  claudeData.forEach(item => {
    questions.push({
      id: item.id,
      question: item.question,
      category: item.category
    })
  })
  
  return questions
}