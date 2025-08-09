"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface SentimentChartProps {
  data: Array<{
    model: string
    sentiment: number
    confidence: number
  }>
  darkMode?: boolean
}

export function SentimentChart({ data, darkMode = false }: SentimentChartProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    name: item.model,
    sentiment: item.sentiment,
    confidence: item.confidence,
    fill: getSentimentColor(item.sentiment, darkMode),
  }))

  function getSentimentColor(score: number, darkMode: boolean) {
    if (score > 0.1) return darkMode ? "#10B981" : "#34D399" // green
    if (score < -0.1) return darkMode ? "#EF4444" : "#F87171" // red
    return darkMode ? "#6B7280" : "#9CA3AF" // gray
  }

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: darkMode ? "#9CA3AF" : "#6B7280" }}
        />
        <YAxis
          domain={[-1, 1]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: darkMode ? "#9CA3AF" : "#6B7280" }}
          tickFormatter={(value) => {
            if (value === 1) return "Positive"
            if (value === 0) return "Neutral"
            if (value === -1) return "Negative"
            return ""
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              const sentimentLabel = data.sentiment > 0.1 ? "Positive" : data.sentiment < -0.1 ? "Negative" : "Neutral"

              return (
                <div
                  className={`p-2 rounded shadow-md ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}
                >
                  <p className={`text-xs font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{data.name}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Sentiment: <span className="font-medium">{sentimentLabel}</span> ({data.sentiment.toFixed(2)})
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Confidence: {(data.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="sentiment" radius={[4, 4, 4, 4]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
