// Simple sentiment analysis function
// In production, you might use a more sophisticated library or API

export function analyzeSentiment(text: string): { score: number; confidence: number } {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "best",
    "perfect",
    "awesome",
    "brilliant",
    "outstanding",
    "superb",
    "magnificent",
    "beneficial",
    "positive",
    "effective",
    "successful",
    "valuable",
    "important",
    "helpful",
    "useful",
  ]

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "disgusting",
    "pathetic",
    "useless",
    "worthless",
    "dangerous",
    "harmful",
    "negative",
    "problematic",
    "concerning",
    "risk",
    "threat",
    "crisis",
    "problem",
    "issue",
    "challenge",
    "difficulty",
    "serious",
  ]

  const words = text.toLowerCase().split(/\W+/)
  let positiveCount = 0
  let negativeCount = 0

  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveCount++
    if (negativeWords.includes(word)) negativeCount++
  })

  const totalSentimentWords = positiveCount + negativeCount
  const score = totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0

  const confidence = Math.min(totalSentimentWords / 10, 1) // Max confidence at 10+ sentiment words

  return {
    score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
    confidence,
  }
}
