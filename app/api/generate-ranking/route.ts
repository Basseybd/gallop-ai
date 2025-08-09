import { NextRequest, NextResponse } from 'next/server'
import { queryAIModel, generateRankingPrompt, getAvailableProviders, type AIModel } from '@/lib/ai-providers'

export interface TrendRequest {
  question: string
  category: string
  models: AIModel[]
  customOptions?: string[]
  startDate: string
  endDate: string
  queryFrequency: 'monthly' | 'biannual'
}

export interface RankingResponse {
  success: boolean
  data?: {
    rankings: Array<{
      name: string
      ranks: Record<string, number>
      change: 'up' | 'down' | 'same'
    }>
    trendData: Array<{
      date: string
      formattedDate: string
      [itemName: string]: string | number | null
    }>
  }
  error?: string
  availableModels?: Array<{
    id: AIModel
    name: string
    available: boolean
  }>
}

function parseRankingResponse(response: string): string[] {
  // Extract numbered list items from AI response
  const lines = response.split('\n')
  const rankings: string[] = []
  
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)$/m)
    if (match && match[1]) {
      rankings.push(match[1].trim())
    }
  }
  
  return rankings.slice(0, 5) // Ensure max 5 items
}

function generateDateRange(startDate: string, endDate: string, frequency: 'monthly' | 'biannual'): string[] {
  const dates: string[] = []
  const start = new Date(startDate + '-01')
  const end = new Date(endDate + '-01')
  
  let current = new Date(start)
  
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 7))
    
    if (frequency === 'monthly') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setMonth(current.getMonth() + 6)
    }
  }
  
  return dates
}

export async function POST(request: NextRequest) {
  try {
    const body: TrendRequest = await request.json()
    const { question, category, models, customOptions, startDate, endDate, queryFrequency } = body

    // Validate required fields
    if (!question || !models || models.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question and at least one model are required' 
      }, { status: 400 })
    }

    // Check which models are available
    const availableProviders = getAvailableProviders()
    const availableModelIds = availableProviders
      .filter(p => p.available)
      .map(p => p.id)
    
    // Filter requested models to only available ones
    const validModels = models.filter(m => availableModelIds.includes(m))
    
    if (validModels.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid models available. Please check server configuration.',
        availableModels: availableProviders
      }, { status: 400 })
    }

    // Generate date range for historical analysis
    const dateRange = generateDateRange(startDate, endDate, queryFrequency)
    
    // Store rankings for each model and date
    const modelRankings: Record<string, Record<string, string[]>> = {}
    
    // Query each model for each time period
    for (const modelId of validModels) {
      modelRankings[modelId] = {}
      
      for (const date of dateRange) {
        const dateObj = new Date(date + '-01')
        const dateString = dateObj.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
        
        const prompt = generateRankingPrompt(question, customOptions, dateString)
        
        try {
          const response = await queryAIModel(modelId, prompt)
          const rankings = parseRankingResponse(response)
          modelRankings[modelId][date] = rankings
        } catch (error) {
          console.error(`Failed to query ${modelId} for ${date}:`, error)
          // Use empty array for failed queries
          modelRankings[modelId][date] = []
        }
      }
    }

    // Combine all unique items across all models and dates
    const allItems = new Set<string>()
    Object.values(modelRankings).forEach(modelData => {
      Object.values(modelData).forEach(rankings => {
        rankings.forEach(item => allItems.add(item))
      })
    })

    // Create combined rankings structure
    const combinedRankings = Array.from(allItems).map(itemName => {
      const ranks: Record<string, number> = {}
      
      // Get latest ranking for each model
      validModels.forEach(modelId => {
        const latestDate = dateRange[dateRange.length - 1]
        const modelLatestRankings = modelRankings[modelId][latestDate] || []
        const rankIndex = modelLatestRankings.findIndex(item => item === itemName)
        if (rankIndex !== -1) {
          ranks[modelId] = rankIndex + 1
        }
      })
      
      return {
        name: itemName,
        ranks,
        change: 'same' as const // Could implement trend analysis here
      }
    })

    // Generate trend data
    const trendData = dateRange.map(date => {
      const dateObj = new Date(date + '-01')
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
      
      const trendPoint: Record<string, any> = {
        date: date,
        formattedDate: formattedDate
      }
      
      // Add ranking data for each item
      Array.from(allItems).forEach(itemName => {
        validModels.forEach(modelId => {
          const rankings = modelRankings[modelId][date] || []
          const rankIndex = rankings.findIndex(item => item === itemName)
          const rank = rankIndex !== -1 ? rankIndex + 1 : null
          trendPoint[`${itemName}_${modelId}`] = rank
        })
      })
      
      return trendPoint
    })

    return NextResponse.json({
      success: true,
      data: {
        rankings: combinedRankings,
        trendData: trendData
      }
    })

  } catch (error) {
    console.error('Error generating ranking:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  // Return available models
  const availableProviders = getAvailableProviders()
  
  return NextResponse.json({
    success: true,
    availableModels: availableProviders
  })
}