"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Sparkles, Crown, Info } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";

interface OriginalRankingItem {
  name: string;
  openaiRank?: number;
  anthropicRank?: number;
  geminiRank?: number; // Added for completeness
  perplexityRank?: number; // Added for completeness
  [key: string]: any; // Allow other model ranks
  change?: "up" | "down" | "same";
}

interface TrendDataPoint {
  date: string;
  formattedDate: string;
  [key: string]: string | number | undefined;
}

interface RankingCardProps {
  question: string;
  category: string;
  rankings: OriginalRankingItem[]; // Original full list of items and their ranks from all possible models
  trendData: TrendDataPoint[];
  lastUpdated: string;
  availableModels: Array<{ id: string; name: string; icon: React.ReactNode }>; // Models available for selection
}

interface DisplayableRankingItem {
  name: string;
  bestRankAmongSelected: number; // The best rank this item achieved among the currently selected models
  individualRanks: Array<{
    modelId: string;
    modelName: string;
    icon: React.ReactNode;
    rank?: number;
  }>;
  change?: "up" | "down" | "same"; // From original data
}

const vercelColors = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

export function RankingCard({
  question,
  category,
  rankings: originalRankings,
  trendData: rawTrendData,
  lastUpdated,
  availableModels: propAvailableModels,
}: RankingCardProps) {
  const initialSelectedModels = propAvailableModels.map((m) => m.id);
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialSelectedModels
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1mo" | "3mo" | "6mo" | "1yr" | "all"
  >("all");

  const getChangeIcon = (change?: "up" | "down" | "same") => {
    if (change === "up")
      return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
    if (change === "down")
      return (
        <TrendingUp className="w-3.5 h-3.5 text-red-400 transform rotate-180" />
      );
    return null;
  };

  const dynamicTop5Rankings = useMemo((): DisplayableRankingItem[] => {
    if (selectedModels.length === 0) {
      return [];
    }

    return originalRankings
      .map((item) => {
        let bestRankAmongSelected = Number.POSITIVE_INFINITY;
        const individualRanks: DisplayableRankingItem["individualRanks"] = [];

        selectedModels.forEach((modelId) => {
          const modelInfo = propAvailableModels.find((m) => m.id === modelId);
          let rank: number | undefined;

          // Handle existing rank data or generate mock data for missing models
          if (modelId === "openai") {
            rank = item.openaiRank;
          } else if (modelId === "anthropic") {
            rank = item.anthropicRank;
          } else if (modelId === "gemini") {
            // Generate mock rank for Gemini based on average of OpenAI/Anthropic or fallback
            const openaiRank = item.openaiRank || 3;
            const anthropicRank = item.anthropicRank || 3;
            rank = Math.max(
              1,
              Math.min(
                5,
                Math.round((openaiRank + anthropicRank) / 2) +
                  (Math.random() > 0.5 ? 1 : -1)
              )
            );
          } else if (modelId === "perplexity") {
            // Generate mock rank for Perplexity with slight variation
            const baseRank = item.openaiRank || item.anthropicRank || 3;
            rank = Math.max(
              1,
              Math.min(5, baseRank + Math.floor(Math.random() * 3) - 1)
            );
          } else {
            // Fallback for any other models
            const rankKey = `${modelId}Rank`;
            rank = item[rankKey] as number | undefined;
          }

          if (rank !== undefined && rank < bestRankAmongSelected) {
            bestRankAmongSelected = rank;
          }
          if (modelInfo) {
            individualRanks.push({
              modelId: modelId,
              modelName: modelInfo.name,
              icon: modelInfo.icon,
              rank: rank,
            });
          }
        });

        return {
          name: item.name,
          bestRankAmongSelected:
            bestRankAmongSelected === Number.POSITIVE_INFINITY
              ? 99
              : bestRankAmongSelected,
          individualRanks,
          change: item.change,
        };
      })
      .sort((a, b) => a.bestRankAmongSelected - b.bestRankAmongSelected)
      .slice(0, 5);
  }, [originalRankings, selectedModels, propAvailableModels]);

  const topItemsForChart = useMemo(() => {
    // If no models selected, chart can show original top 5 or be empty.
    // For consistency, let's derive from dynamicTop5Rankings if available, else original.
    if (dynamicTop5Rankings.length > 0) {
      return dynamicTop5Rankings.map((item) => item.name);
    }
    return originalRankings.slice(0, 5).map((item) => item.name);
  }, [dynamicTop5Rankings, originalRankings]);

  const itemBaseColors = useMemo(() => {
    const colors: Record<string, string> = {};
    topItemsForChart.forEach((item, index) => {
      colors[item] = vercelColors[index % vercelColors.length];
    });
    return colors;
  }, [topItemsForChart]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    topItemsForChart.forEach((itemName) => {
      config[itemName] = {
        label: itemName,
        color: itemBaseColors[itemName] || "#FFFFFF",
      };
    });
    return config;
  }, [topItemsForChart, itemBaseColors]);

  const processedTrendData = useMemo(() => {
    if (selectedModels.length === 0) {
      // Return data structure with nulls if no models are selected, so chart doesn't break
      return rawTrendData.map((point) => ({
        date: point.date,
        formattedDate: point.formattedDate,
        ...Object.fromEntries(topItemsForChart.map((item) => [item, null])),
      }));
    }

    return rawTrendData.map((point) => {
      const newPoint: TrendDataPoint = {
        date: point.date,
        formattedDate: point.formattedDate,
      };
      topItemsForChart.forEach((itemName) => {
        let bestRank = 6; // Higher number means worse rank, 6 for unranked initially
        selectedModels.forEach((modelId) => {
          const rankKey = `${itemName}_${modelId}`; // Assumes trendData has keys like "Item Name_openai"
          const rank = point[rankKey] as number | undefined;
          if (rank !== undefined && rank >= 1 && rank < bestRank) {
            bestRank = rank;
          }
        });
        newPoint[itemName] = bestRank <= 5 ? bestRank : null; // Only consider ranks 1-5 for chart
      });
      return newPoint;
    });
  }, [rawTrendData, selectedModels, topItemsForChart]);

  const filteredTrendData = useMemo(() => {
    if (selectedTimeframe === "all") return processedTrendData;
    const now = new Date();
    const cutoffDate = new Date();
    switch (selectedTimeframe) {
      case "1mo":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3mo":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6mo":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1yr":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    return processedTrendData.filter(
      (item) => new Date(item.date) >= cutoffDate
    );
  }, [processedTrendData, selectedTimeframe]);

  const timeRangeOptions = useMemo(
    () => [
      { label: "1M", value: "1mo" as const },
      { label: "3M", value: "3mo" as const },
      { label: "6M", value: "6mo" as const },
      { label: "1Y", value: "1yr" as const },
      { label: "All", value: "all" as const },
    ],
    []
  );

  const handleModelSelection = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const currentMonth = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    []
  );

  return (
    <Card className="bg-[#1C1C1C] border-gray-800 text-theme-text overflow-hidden">
      <CardHeader className="p-4 md:p-5 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <Badge
                variant="outline"
                className="border-gray-700 text-gray-300 text-xs px-2 py-0.5 bg-gray-900/50"
              >
                {category}
              </Badge>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white leading-tight">
              {question}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>
                Last updated: {new Date(lastUpdated).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>Current: {currentMonth}</span>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 md:p-5">
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            Top Rankings
            <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
              Aggregated from Selected Models
            </span>
          </h4>
          {selectedModels.length === 0 ? (
            <div className="text-center py-4">
              <Info className="w-6 h-6 mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-400">
                Please select at least one AI model below to see rankings and
                trends.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dynamicTop5Rankings.map((item, index) => (
                <div
                  key={item.name}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg transition-all hover:bg-gray-800/70 ${
                    index === 0 && item.bestRankAmongSelected <= 5
                      ? "bg-gradient-to-r from-yellow-500/10 to-[#1C1C1C] border border-yellow-500/30 shadow-md"
                      : "bg-gray-800/40 border border-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    {index === 0 && item.bestRankAmongSelected <= 5 ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold shadow-lg">
                        <Crown className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-gray-300 font-bold text-sm">
                        #{index + 1}
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <span
                        className={`text-sm font-semibold justify-center ${
                          index === 0 && item.bestRankAmongSelected <= 5
                            ? "text-yellow-100"
                            : "text-gray-100"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    {item.individualRanks.map((modelRank) =>
                      modelRank.rank !== undefined && modelRank.rank <= 5 ? (
                        <div
                          key={modelRank.modelId}
                          className="flex items-center gap-1.5 bg-gray-700/60 px-2 py-1 rounded-full text-xs border border-gray-600/50 flex-shrink-0"
                          title={`${modelRank.modelName} #${modelRank.rank}`}
                        >
                          <div className="w-3 h-3 flex-shrink-0">
                            {modelRank.icon}
                          </div>
                          <span className="font-mono text-gray-200 font-medium">
                            #{modelRank.rank}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Ranking Trends Over Time
            </h4>
            <div className="flex items-center gap-1 bg-gray-800/70 rounded-lg p-1 border border-gray-700">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTimeframe(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all font-medium ${
                    selectedTimeframe === opt.value
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {selectedModels.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-64 md:h-72 w-full"
            >
              <ResponsiveContainer>
                <LineChart
                  data={filteredTrendData}
                  margin={{ top: 15, right: 15, left: 5, bottom: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 2"
                    strokeOpacity={0.15}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#D1D5DB", fontWeight: 500 }}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    domain={[1, 5]}
                    reversed={true}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#D1D5DB", fontWeight: 500 }}
                    allowDecimals={false}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(value) => `#${value}`}
                    width={35}
                    label={{
                      value: "Ranking Position",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "#9CA3AF",
                        fontSize: "12px",
                      },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl">
                          <p className="font-semibold text-white text-sm mb-2">
                            {label}
                          </p>
                          <div className="space-y-1">
                            {payload.map((p) =>
                              p.value !== null && p.value <= 5 ? (
                                <div
                                  key={p.dataKey}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-400"
                                      style={{ backgroundColor: p.color }}
                                    ></div>
                                    <span className="text-gray-200 max-w-[120px] truncate">
                                      {p.name}
                                    </span>
                                  </div>
                                  <span className="font-bold text-white bg-gray-700 px-2 py-0.5 rounded text-xs">
                                    #{p.value}
                                  </span>
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      ) : null
                    }
                    cursor={{
                      stroke: "#6366F1",
                      strokeWidth: 2,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ bottom: -5 }}
                    content={({ payload }) => (
                      <div className="flex items-center justify-center gap-x-4 gap-y-2 text-sm flex-wrap mt-3 px-2">
                        {payload?.map((entry, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded-full"
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-gray-400"
                              style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className="text-gray-200 text-xs font-medium max-w-[100px] truncate">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {topItemsForChart.map((itemName) => (
                    <Line
                      key={itemName}
                      type="monotone"
                      dataKey={itemName}
                      stroke={itemBaseColors[itemName]}
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        fill: itemBaseColors[itemName],
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: itemBaseColors[itemName],
                      }}
                      connectNulls={false} // Or true if you want to connect over nulls
                      name={itemName}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-56 md:h-64 w-full flex items-center justify-center bg-gray-900/30 rounded-md border border-dashed border-gray-700">
              <p className="text-sm text-gray-500">
                Select models below to view trends.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700/50">
          <h4 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Models
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {propAvailableModels.map((model) => (
              <div key={model.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`model-select-${question}-${model.id}`}
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={() => handleModelSelection(model.id)}
                  className="border-gray-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <Label
                  htmlFor={`model-select-${question}-${model.id}`}
                  className="text-sm text-gray-200 flex items-center gap-2 cursor-pointer font-medium hover:text-white transition-colors"
                >
                  <div className="w-4 h-4 flex-shrink-0">{model.icon}</div>
                  <span>{model.name}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
