// components/unified-ranking-card.tsx
import type React from "react"
import { Bot, Brain, Sparkles } from "lucide-react"

import { RankingCard } from "@/components/ranking-card"
import type { CustomTrend } from "@/lib/types"

/* ------------------------------------------------------------------
   This wrapper lets you reuse <RankingCard /> in two different ways:

   1. Existing code that already provides all <RankingCard> props
      (question, category, rankings, trendData, lastUpdated, …).
   2. Code that passes a single  { trend: CustomTrend }  object.

   It inspects the props at runtime and does the right thing.
------------------------------------------------------------------- */

type Model = "openai" | "anthropic" | "gemini" | "perplexity"

const modelIcons: Record<Model, React.ReactNode> = {
  openai: <Bot className="w-3.5 h-3.5 text-[#6366F1]" />,
  anthropic: <Brain className="w-3.5 h-3.5 text-[#8B5CF6]" />,
  gemini: <Sparkles className="w-3.5 h-3.5 text-yellow-500" />,
  perplexity: <Sparkles className="w-3.5 h-3.5 text-pink-500" />,
}

/* ----------  helpers --------------------------------------------------- */

function transformTrend(trend: CustomTrend) {
  const { request, rankings, trendData } = trend

  const transformedRankings = rankings.map((item) => ({
    name: item.name,
    openaiRank: item.ranks?.openai,
    anthropicRank: item.ranks?.anthropic,
    geminiRank: item.ranks?.gemini,
    perplexityRank: item.ranks?.perplexity,
    change: item.change,
  }))

  return {
    question: request.question,
    category: request.category,
    rankings: transformedRankings,
    trendData,
    lastUpdated: new Date().toISOString(),
    availableModels: request.models.map((m: Model) => ({
      id: m,
      name: m.charAt(0).toUpperCase() + m.slice(1),
      icon: modelIcons[m],
    })),
  }
}

/* ----------  main component ------------------------------------------- */

type RankingCardLikeProps = React.ComponentProps<typeof RankingCard>

type UnifiedRankingCardProps = RankingCardLikeProps | { trend: CustomTrend } | (RankingCardLikeProps & {
  type?: "sample" | "custom"
  onRemove?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  metadata?: any
})

/** Accepts either full RankingCard props *or* { trend: CustomTrend } */
export function UnifiedRankingCard(props: UnifiedRankingCardProps) {
  // If a `trend` object exists, convert it; otherwise forward the props.
  if ("trend" in props) {
    const rankingProps = transformTrend(props.trend)
    return <RankingCard {...rankingProps} />
  }

  // Filter out the non-RankingCard props before passing to RankingCard
  const { type, onRemove, onRefresh, isLoading, metadata, ...rankingCardProps } = props as RankingCardLikeProps & {
    type?: string
    onRemove?: () => void
    onRefresh?: () => void
    isLoading?: boolean
    metadata?: any
  }

  return <RankingCard {...rankingCardProps} />
}

export default UnifiedRankingCard
