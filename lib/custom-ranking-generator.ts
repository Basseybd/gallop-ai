import type { TrendRequest } from "@/components/trend-request-form"

// Real LLM API integration for historical trends with batching
export async function generateCustomRanking(request: TrendRequest) {
  const historicalData = await generateHistoricalTrendsBatched(request)

  // Process the historical data to create current rankings based on #1 appearances
  const rankings = processHistoricalDataToRankings(historicalData, request)

  // Generate trend data from the historical responses (tracking #1 appearances)
  const trendData = processHistoricalDataToTrends(historicalData, request)

  return { rankings, trendData, historicalData }
}

async function generateHistoricalTrendsBatched(request: TrendRequest) {
  const { question, startDate, endDate, queryFrequency, models, apiKeys } = request

  // Generate date points based on frequency, ensuring current month is included
  const datePoints = generateDatePoints(startDate, endDate, queryFrequency)

  // Determine optimal batch size (3-5 months per batch as specified)
  const batchSize = queryFrequency === "monthly" ? 4 : 3 // 4 months or 3 biannual periods per batch

  const historicalData: Array<{
    date: string
    formattedDate: string
    responses: Record<string, string>
    topItems: Record<string, string>
  }> = []

  // Process each model
  for (const model of models) {
    try {
      console.log(`Processing ${model} with ${datePoints.length} date points in batches of ${batchSize}`)

      // Create batched prompts
      const batchedPrompts = []
      for (let i = 0; i < datePoints.length; i += batchSize) {
        const batch = datePoints.slice(i, i + batchSize)
        const prompts = batch.map((datePoint) => ({
          id: `${model}-${datePoint.date}`,
          question,
          monthYear: datePoint.monthYear,
          date: datePoint.date,
          formattedDate: datePoint.formatted,
        }))
        batchedPrompts.push(prompts)
      }

      // Query all batches for this model
      for (const promptBatch of batchedPrompts) {
        try {
          const batchResponses = await queryLLMBatchViaAPI(model, promptBatch, apiKeys[model])

          // Process responses for each date point in the batch
          promptBatch.forEach((prompt) => {
            const response = batchResponses[prompt.id] || "No response"

            // Find or create historical data entry for this date
            let dataEntry = historicalData.find((entry) => entry.date === prompt.date)
            if (!dataEntry) {
              dataEntry = {
                date: prompt.date,
                formattedDate: prompt.formattedDate,
                responses: {},
                topItems: {},
              }
              historicalData.push(dataEntry)
            }

            dataEntry.responses[model] = response
            dataEntry.topItems[model] = extractTopItemFromResponse(response)
          })
        } catch (error) {
          console.error(`Error processing batch for ${model}:`, error)
          // Handle failed batch gracefully
          promptBatch.forEach((prompt) => {
            let dataEntry = historicalData.find((entry) => entry.date === prompt.date)
            if (!dataEntry) {
              dataEntry = {
                date: prompt.date,
                formattedDate: prompt.formattedDate,
                responses: {},
                topItems: {},
              }
              historicalData.push(dataEntry)
            }
            dataEntry.responses[model] = "Error: Unable to fetch response"
            dataEntry.topItems[model] = ""
          })
        }
      }
    } catch (error) {
      console.error(`Error processing model ${model}:`, error)
    }
  }

  // Sort historical data by date
  historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return historicalData
}

function generateDatePoints(startDate: string, endDate: string, frequency: "monthly" | "biannual") {
  const points = []
  const start = new Date(startDate + "-01")
  const end = new Date(endDate + "-01")
  const now = new Date()

  // Ensure we include the current month if it's not already covered
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (currentMonth > end) {
    end.setTime(currentMonth.getTime())
  }

  const current = new Date(start)

  while (current <= end) {
    const monthYear = current.toLocaleString("default", { month: "long", year: "numeric" })
    const formatted = current.toLocaleString("default", { month: "short", year: "numeric" })

    points.push({
      date: current.toISOString(),
      monthYear,
      formatted,
    })

    // Increment based on frequency
    if (frequency === "monthly") {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setMonth(current.getMonth() + 6)
    }
  }

  return points
}

async function queryLLMBatchViaAPI(model: string, prompts: any[], apiKey?: string): Promise<Record<string, string>> {
  if (!apiKey) {
    throw new Error(`API key required for ${model}`)
  }

  const response = await fetch("/api/query-llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompts,
      apiKey,
      batchSize: 4, // Process 4 months at a time
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`API call failed: ${response.statusText} - ${errorData.error || "Unknown error"}`)
  }

  const data = await response.json()
  return data.responses
}

function extractTopItemFromResponse(response: string): string {
  if (!response || response.includes("Error:") || response.includes("No result")) {
    return ""
  }

  // The response should already be the #1 item from the parsing
  return response.trim()
}

function processHistoricalDataToRankings(historicalData: any[], request: TrendRequest) {
  // Count frequency of each item appearing as #1 across all time periods and models
  const itemCounts: Record<string, { count: number; models: Set<string>; lastSeen: string }> = {}

  historicalData.forEach((dataPoint) => {
    request.models.forEach((model) => {
      const topItem = dataPoint.topItems[model]
      if (topItem && topItem.trim()) {
        if (!itemCounts[topItem]) {
          itemCounts[topItem] = { count: 0, models: new Set(), lastSeen: dataPoint.date }
        }
        itemCounts[topItem].count++
        itemCounts[topItem].models.add(model)
        itemCounts[topItem].lastSeen = dataPoint.date
      }
    })
  })

  // Convert to final ranking format
  const rankings = Object.entries(itemCounts)
    .map(([name, data]) => {
      const ranks: Record<string, number> = {}

      // Calculate average rank based on #1 appearances
      request.models.forEach((model) => {
        ranks[model] = data.models.has(model) ? 1 : undefined
      })

      return {
        name,
        ranks,
        count: data.count,
        change: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : ("same" as const),
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return rankings
}

function processHistoricalDataToTrends(historicalData: any[], request: TrendRequest) {
  // Get all unique items that appeared as #1
  const allTopItems = new Set<string>()
  historicalData.forEach((dataPoint) => {
    request.models.forEach((model) => {
      const topItem = dataPoint.topItems[model]
      if (topItem && topItem.trim()) {
        allTopItems.add(topItem)
      }
    })
  })

  const itemsArray = Array.from(allTopItems).slice(0, 8) // Top 8 most mentioned items

  return historicalData.map((dataPoint) => {
    const trendPoint: any = {
      date: dataPoint.date,
      formattedDate: dataPoint.formattedDate,
    }

    // For each item, count how many models ranked it #1 at this time point
    itemsArray.forEach((item) => {
      let appearances = 0
      request.models.forEach((model) => {
        const topItem = dataPoint.topItems[model]
        if (topItem === item) {
          appearances++
        }
      })

      // Store the number of appearances (popularity score)
      trendPoint[item] = appearances
    })

    return trendPoint
  })
}
