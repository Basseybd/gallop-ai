"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SentimentChart } from "@/components/sentiment-chart"
import { analyzeSentiment } from "@/lib/analysis"
import { Bot, Brain, Sparkles, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react"

interface PromptCardProps {
  prompt: {
    id: string
    question: string
    category: string
    responses: {
      openai?: string
      anthropic?: string
      error?: string
    }
    timestamp: string
  }
}

const modelIcons = {
  openai: <Bot className="w-4 h-4" />,
  anthropic: <Brain className="w-4 h-4" />,
}

export function PromptCard({ prompt }: PromptCardProps) {
  // Analyze sentiment for each response
  const sentimentData = []

  if (prompt.responses.openai) {
    const sentiment = analyzeSentiment(prompt.responses.openai)
    sentimentData.push({
      model: "OpenAI",
      sentiment: sentiment.score,
      confidence: sentiment.confidence,
    })
  }

  if (prompt.responses.anthropic) {
    const sentiment = analyzeSentiment(prompt.responses.anthropic)
    sentimentData.push({
      model: "Anthropic",
      sentiment: sentiment.score,
      confidence: sentiment.confidence,
    })
  }

  // Format the timestamp
  const formattedDate = new Date(prompt.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Format the current month
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <ThumbsUp className="w-4 h-4 text-green-400" />
    if (score < -0.1) return <ThumbsDown className="w-4 h-4 text-red-400" />
    return null
  }

  const getSentimentLabel = (score: number) => {
    if (score > 0.1) return "Positive"
    if (score < -0.1) return "Negative"
    return "Neutral"
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return "text-green-400"
    if (score < -0.1) return "text-red-400"
    return "text-gray-400"
  }

  const getSentimentBadgeVariant = (score: number) => {
    if (score > 0.1) return "default"
    if (score < -0.1) return "destructive"
    return "secondary"
  }

  return (
    <Card className="bg-[#111] border-gray-800 text-white overflow-hidden h-fit">
      <CardHeader className="pb-4 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6366F1]" />
              <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                {prompt.category}
              </Badge>
            </div>
            <CardTitle className="text-lg text-white">{prompt.question}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Analyzed: {formattedDate}</span>
              <span>•</span>
              <span>Current: {currentMonth}</span>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Sentiment Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <span>Sentiment Analysis</span>
          </h4>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <SentimentChart data={sentimentData} darkMode={true} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              {sentimentData.map((item, index) => (
                <div
                  key={item.model}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.sentiment > 0.1
                      ? "bg-gradient-to-r from-green-500/20 to-[#111] border border-green-500/30"
                      : item.sentiment < -0.1
                        ? "bg-gradient-to-r from-red-500/20 to-[#111] border border-red-500/30"
                        : "bg-gray-800/50 border border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.model === "OpenAI" ? (
                      <Bot className="w-4 h-4 text-[#6366F1]" />
                    ) : (
                      <Brain className="w-4 h-4 text-[#8B5CF6]" />
                    )}
                    <span className="text-sm text-white">{item.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(item.sentiment)}
                    <span className={`text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                      {getSentimentLabel(item.sentiment)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model Responses */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Model Responses</h4>
          <Tabs defaultValue="openai" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800">
              <TabsTrigger
                value="openai"
                className="flex items-center gap-2 data-[state=active]:bg-[#6366F1] data-[state=active]:text-white"
              >
                {modelIcons.openai}
                OpenAI
              </TabsTrigger>
              <TabsTrigger
                value="anthropic"
                className="flex items-center gap-2 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white"
              >
                {modelIcons.anthropic}
                Anthropic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="openai" className="mt-4">
              <div className="space-y-2 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-300">OpenAI Response</h5>
                  {sentimentData.find((d) => d.model === "OpenAI") && (
                    <Badge
                      variant={getSentimentBadgeVariant(sentimentData.find((d) => d.model === "OpenAI")!.sentiment)}
                      className="flex items-center gap-1"
                    >
                      {getSentimentIcon(sentimentData.find((d) => d.model === "OpenAI")!.sentiment)}
                      {getSentimentLabel(sentimentData.find((d) => d.model === "OpenAI")!.sentiment)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {prompt.responses.openai || "No response available"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="anthropic" className="mt-4">
              <div className="space-y-2 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-300">Anthropic Response</h5>
                  {sentimentData.find((d) => d.model === "Anthropic") && (
                    <Badge
                      variant={getSentimentBadgeVariant(sentimentData.find((d) => d.model === "Anthropic")!.sentiment)}
                      className="flex items-center gap-1"
                    >
                      {getSentimentIcon(sentimentData.find((d) => d.model === "Anthropic")!.sentiment)}
                      {getSentimentLabel(sentimentData.find((d) => d.model === "Anthropic")!.sentiment)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {prompt.responses.anthropic || "No response available"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
