import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, X } from "lucide-react"

import { RankingCard } from "@/components/ranking-card"
import type { CustomTrend, Model } from "@/lib/types"

/*  No "use client" directive here.
    RankingCard already carries it and holds all client-side hooks.           */

function toRankingCardProps(trend: CustomTrend) {
  const { request, rankings, trendData } = trend
  return {
    question: request.question,
    category: request.category,
    rankings, // already OriginalRankingItem[]
    trendData, // already TrendDataPoint[]
    lastUpdated: new Date().toISOString(),
    availableModels: request.models.map((m: Model) => ({
      id: m,
      name: m.charAt(0).toUpperCase() + m.slice(1),
      icon: null, // we don't need icons here – RankingCard handles them
    })),
  }
}

export function CustomRankingCard({
  trend,
  onRemove,
  onRefresh,
  isLoading = false,
}: {
  trend: CustomTrend
  onRemove: () => void
  onRefresh: () => void
  isLoading?: boolean
}) {
  const rankingProps = toRankingCardProps(trend)

  return (
    <Card className="relative bg-[#1C1C1C] border-gray-800">
      <CardHeader className="p-3 border-b border-gray-800 flex items-center justify-between">
        <Badge
          variant="outline"
          className="border-theme-accent/50 text-theme-accent text-xs px-2 py-0.5 bg-theme-accent/10"
        >
          Custom Analysis
        </Badge>

        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 w-7 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove} className="h-7 w-7 text-gray-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <RankingCard {...rankingProps} />
      </CardContent>
    </Card>
  )
}
