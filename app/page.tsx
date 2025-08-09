"use client"

import { useState } from "react"
import { TrendRequestForm, type TrendRequest } from "@/components/trend-request-form"
import { getRankingData } from "@/lib/ranking-data"
import { rankingPrompts } from "@/lib/ranking-prompts"
import { getJsonRankingData, getAvailableQuestions } from "@/lib/json-data-loader"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Bot, Brain, Sparkles } from "lucide-react"
import { UnifiedRankingCard } from "@/components/unified-ranking-card"

export default function HomePage() {
  const [customTrends, setCustomTrends] = useState<
    Array<{
      id: string
      request: TrendRequest
      rankings: any[]
      trendData: any[]
      historicalData?: any[]
    }>
  >([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTrendForm, setShowTrendForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleTrendRequest = async (request: TrendRequest) => {
    setIsGenerating(true)
    try {
      console.log("Generating historical trends with server-side AI calls...")

      const response = await fetch('/api/generate-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate ranking')
      }

      const { data } = await response.json()
      const newTrend = {
        id: Date.now().toString(),
        request,
        rankings: data.rankings,
        trendData: data.trendData,
        historicalData: data.trendData, // Use trendData as historicalData
      }

      setCustomTrends((prev) => [newTrend, ...prev])
      setShowTrendForm(false) // Hide form after successful submission
    } catch (error) {
      console.error("Error generating trend:", error)
      alert(
        `Error generating trend: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      )
    } finally {
      setIsGenerating(false)
    }
  }


  const removeTrend = (id: string) => {
    setCustomTrends((prev) => prev.filter((trend) => trend.id !== id))
  }

  const refreshTrend = async (id: string) => {
    const trend = customTrends.find((t) => t.id === id)
    if (!trend) return

    try {
      const response = await fetch('/api/generate-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trend.request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh ranking')
      }

      const { data } = await response.json()
      setCustomTrends((prev) => prev.map((t) => (t.id === id ? { ...t, rankings: data.rankings, trendData: data.trendData } : t)))
    } catch (error) {
      console.error("Error refreshing trend:", error)
      alert("Error refreshing trend. Please try again.")
    }
  }

  // Helper function to normalize rankings data for consistent rendering
  const normalizeRankingsData = (rankings: any[], models: string[]) => {
    if (!rankings || !Array.isArray(rankings)) return []

    return rankings.map((item, index) => ({
      name: item.name || `Item ${index + 1}`,
      ranks: models.reduce(
        (acc, model) => {
          acc[model] = item.ranks?.[model] || item[`${model}Rank`] || undefined
          return acc
        },
        {} as Record<string, number | undefined>,
      ),
      count: item.count || 0,
      change: item.change || "same",
      // Add flexible metadata
      metadata: {
        confidence: item.confidence || 0.5,
        sources: item.sources || [],
        lastUpdated: item.lastUpdated || new Date().toISOString(),
      },
    }))
  }

  // Helper function to normalize trend data structure
  const normalizeTrendData = (trendData: any[], models: string[]) => {
    if (!trendData || !Array.isArray(trendData)) return []

    return trendData.map((point) => {
      const normalizedPoint = {
        date: point.date,
        formattedDate: point.formattedDate,
      }

      // Ensure all expected data keys exist
      Object.keys(point).forEach((key) => {
        if (!["date", "formattedDate"].includes(key)) {
          normalizedPoint[key] = point[key] !== undefined ? point[key] : null
        }
      })

      return normalizedPoint
    })
  }

  // Helper function to assess data quality for adaptive rendering
  const assessDataQuality = (rankings: any[], trendData: any[]) => {
    const rankingsQuality = rankings?.length > 0 ? "good" : "poor"
    const trendQuality = trendData?.length > 3 ? "good" : trendData?.length > 0 ? "fair" : "poor"

    if (rankingsQuality === "good" && trendQuality === "good") return "excellent"
    if (rankingsQuality === "good" || trendQuality === "good") return "good"
    return "fair"
  }

  // Helper function to detect content type for specialized rendering
  const detectContentType = (question: string) => {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes("burger") || lowerQuestion.includes("restaurant") || lowerQuestion.includes("food")) {
      return "food"
    }
    if (lowerQuestion.includes("tech") || lowerQuestion.includes("ai") || lowerQuestion.includes("software")) {
      return "technology"
    }
    if (lowerQuestion.includes("company") || lowerQuestion.includes("business") || lowerQuestion.includes("startup")) {
      return "business"
    }
    if (lowerQuestion.includes("person") || lowerQuestion.includes("ceo") || lowerQuestion.includes("leader")) {
      return "people"
    }

    return "general"
  }

  // Helper function to determine optimal display count based on data volume
  const getMaxDisplayItems = (totalItems: number) => {
    if (totalItems <= 5) return totalItems
    if (totalItems <= 10) return 7
    return 10
  }

  const currentTime = new Date().toLocaleString()

  const defaultAvailableModels = [
    { id: "openai", name: "OpenAI", icon: <Bot className="w-3.5 h-3.5 text-[#6366F1]" /> },
    { id: "anthropic", name: "Anthropic", icon: <Brain className="w-3.5 h-3.5 text-[#8B5CF6]" /> },
    { id: "gemini", name: "Gemini", icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> },
    { id: "perplexity", name: "Perplexity", icon: <Sparkles className="w-3.5 h-3.5 text-pink-500" /> },
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-white">Gallop AI</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Keep up with AI trends & bias - discover how different models see the world
          </p>
        </div>

        {/* Custom Trend Request Toggle */}
        <div className="mb-8">
          {!showTrendForm ? (
            <div className="text-center">
              <Button
                onClick={() => setShowTrendForm(true)}
                className="bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium px-6 py-3 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Custom Trend Analysis
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Compare how different AI models rank your custom topics over time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#6366F1]" />
                  Custom Trend Analysis
                </h2>
                <Button
                  onClick={() => setShowTrendForm(false)}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
              <TrendRequestForm onSubmit={handleTrendRequest} isLoading={isGenerating} />
            </div>
          )}
        </div>

        {/* Custom Trends */}
        {customTrends.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Custom Trends</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {customTrends.map((trend) => (
                <UnifiedRankingCard
                  key={trend.id}
                  type="custom"
                  question={trend.request.question}
                  category={trend.request.category}
                  rankings={normalizeRankingsData(trend.rankings, trend.request.models)}
                  trendData={normalizeTrendData(trend.trendData, trend.request.models)}
                  lastUpdated={new Date().toISOString()}
                  availableModels={trend.request.models.map(
                    (modelId) =>
                      defaultAvailableModels.find((m) => m.id === modelId) || {
                        id: modelId,
                        name: modelId.charAt(0).toUpperCase() + modelId.slice(1),
                        icon: <Sparkles className="w-3.5 h-3.5" />,
                      },
                  )}
                  onRemove={() => removeTrend(trend.id)}
                  onRefresh={() => refreshTrend(trend.id)}
                  isLoading={isLoading}
                  metadata={{
                    totalItems: trend.rankings?.length || 0,
                    modelCount: trend.request.models.length,
                    hasHistoricalData: Boolean(trend.historicalData?.length),
                    dataQuality: assessDataQuality(trend.rankings, trend.trendData),
                    contentType: detectContentType(trend.request.question),
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sample Results */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Sample Results</h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {getAvailableQuestions().slice(0, 6).map((questionInfo) => {
              const data = getJsonRankingData(questionInfo.id)

              // Use the trend data directly from JSON (already processed)

              return (
                <UnifiedRankingCard
                  key={questionInfo.id}
                  type="sample"
                  question={data.question}
                  category={data.category}
                  rankings={data.rankings}
                  trendData={data.trendData}
                  lastUpdated={currentTime}
                  availableModels={defaultAvailableModels}
                />
              )
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-600">Powered by OpenAI and Anthropic • Built with Next.js and Vercel</p>
        </div>
      </div>
    </div>
  )
}
