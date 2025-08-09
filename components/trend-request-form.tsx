"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Info, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TrendRequestFormProps {
  onSubmit: (request: TrendRequest) => void
  isLoading?: boolean
}

export interface TrendRequest {
  question: string
  category: string
  models: string[]
  customOptions?: string[]
  startDate: string
  endDate: string
  queryFrequency: "monthly" | "biannual"
}

interface FormErrors {
  question?: string
  models?: string
  dateRange?: string
  startDate?: string
  endDate?: string
}

const availableModels = [
  { id: "openai", name: "OpenAI GPT-4", available: true, requiresKey: false },
  { id: "anthropic", name: "Anthropic Claude", available: true, requiresKey: false },
  { id: "perplexity", name: "Perplexity", available: true, requiresKey: false },
  { id: "gemini", name: "Google Gemini", available: true, requiresKey: false },
]

const categories = [
  "Food & Dining",
  "Technology",
  "Business",
  "Entertainment",
  "Travel",
  "Health",
  "Education",
  "Finance",
  "Sports",
  "Custom",
]

const techCeoSuggestions = [
  "Satya Nadella (Microsoft)",
  "Jensen Huang (NVIDIA)",
  "Tim Cook (Apple)",
  "Sundar Pichai (Google)",
  "Andy Jassy (Amazon)",
  "Lisa Su (AMD)",
  "Sam Altman (OpenAI)",
  "Elon Musk (Tesla/SpaceX)",
  "Mark Zuckerberg (Meta)",
  "Pat Gelsinger (Intel)",
]


export function TrendRequestForm({ onSubmit, isLoading }: TrendRequestFormProps) {
  const [question, setQuestion] = useState("")
  const [category, setCategory] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([]) // Start with no models selected
  const [customOptions, setCustomOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [startDate, setStartDate] = useState("")
  // Set end date to current month to include current month in analysis
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 7))
  const [queryFrequency, setQueryFrequency] = useState<"monthly" | "biannual">("monthly")
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Question validation
    if (!question.trim()) {
      newErrors.question = "Please enter a question for ranking analysis"
    } else if (question.trim().length < 10) {
      newErrors.question = "Question should be at least 10 characters long"
    } else if (question.trim().length > 200) {
      newErrors.question = "Question should be less than 200 characters"
    }

    // Models validation
    if (selectedModels.length === 0) {
      newErrors.models = "Please select at least one AI model"
    }

    // Start date validation
    if (!startDate.trim()) {
      newErrors.startDate = "Please select a start date"
    }

    // End date validation
    if (!endDate.trim()) {
      newErrors.endDate = "Please select an end date"
    }

    // Date range validation (only if both dates are provided)
    if (startDate.trim() && endDate.trim()) {
      const start = new Date(startDate + "-01")
      const end = new Date(endDate + "-01")
      const now = new Date()

      if (start > end) {
        newErrors.dateRange = "Start date must be before end date"
      } else if (end > now) {
        newErrors.dateRange = "End date cannot be in the future"
      } else if (start < new Date("2015-01-01")) {
        newErrors.dateRange = "Start date cannot be before 2015"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) => {
      const newModels = prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
      // Clear model-specific errors when models change
      if (errors.models && newModels.length > 0) {
        setErrors((prev) => ({ ...prev, models: undefined }))
      }
      return newModels
    })
  }

  const addCustomOption = () => {
    if (newOption.trim() && !customOptions.includes(newOption.trim())) {
      setCustomOptions([...customOptions, newOption.trim()])
      setNewOption("")
    }
  }

  const removeCustomOption = (option: string) => {
    setCustomOptions(customOptions.filter((opt) => opt !== option))
  }


  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    // Clear start date and date range errors when start date is selected
    if (errors.startDate && value.trim()) {
      setErrors((prev) => ({ ...prev, startDate: undefined }))
    }
    if (errors.dateRange && value.trim() && endDate.trim()) {
      setErrors((prev) => ({ ...prev, dateRange: undefined }))
    }
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    // Clear end date and date range errors when end date is selected
    if (errors.endDate && value.trim()) {
      setErrors((prev) => ({ ...prev, endDate: undefined }))
    }
    if (errors.dateRange && startDate.trim() && value.trim()) {
      setErrors((prev) => ({ ...prev, dateRange: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
        return
    }

    onSubmit({
      question: question.trim(),
      category: category || "Custom",
      models: selectedModels,
      customOptions: customOptions.length > 0 ? customOptions : undefined,
      startDate,
      endDate,
      queryFrequency,
    })
  }

  const addSuggestion = (suggestion: string) => {
    if (!customOptions.includes(suggestion)) {
      setCustomOptions([...customOptions, suggestion])
    }
  }

  const isTechCeoQuestion =
    question.toLowerCase().includes("ceo") ||
    question.toLowerCase().includes("chief executive") ||
    question.toLowerCase().includes("tech leader")


  return (
    <Card className="bg-[#111] border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-[#6366F1]" />
          Request Custom Trend Analysis
        </CardTitle>
        <CardDescription className="text-gray-400">
          Compare how different AI models rank items based on your custom query
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Input */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium text-gray-300">
              What would you like to rank? *
            </Label>
            <Textarea
              id="question"
              placeholder="e.g., best burger in NYC, top programming frameworks, most innovative startups..."
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value)
                if (errors.question && e.target.value.trim().length >= 10) {
                  setErrors((prev) => ({ ...prev, question: undefined }))
                }
              }}
              className={`bg-gray-900 border-gray-700 text-white placeholder-gray-500 resize-none ${
                errors.question ? "border-red-500 focus:border-red-500" : ""
              }`}
              rows={3}
            />
            {errors.question && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.question}
              </p>
            )}

            {/* Tech CEO Suggestions */}
            {isTechCeoQuestion && (
              <div className="mt-2 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#6366F1]" />
                  <p className="text-sm text-gray-300">Suggested tech CEOs to include:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techCeoSuggestions.slice(0, 6).map((ceo) => (
                    <Badge
                      key={ceo}
                      variant="outline"
                      className="bg-gray-800 text-gray-300 hover:bg-[#6366F1]/20 hover:border-[#6366F1]/50 cursor-pointer"
                      onClick={() => addSuggestion(ceo)}
                    >
                      + {ceo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-800">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Models Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300">AI Models to Query *</Label>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
                Select the AI models you want to compare. The analysis will be performed server-side using configured providers.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={model.id}
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={() => handleModelToggle(model.id)}
                    className="border-gray-600 data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                  />
                  <Label htmlFor={model.id} className="text-sm text-white flex items-center gap-2">
                    {model.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.models && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.models}
              </p>
            )}
          </div>


          {/* Date Range Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-300">Historical Date Range *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700 max-w-xs">
                    <p>
                      Select the time period to analyze. The system will automatically include the current month and
                      batch multiple months per query to reduce costs while maintaining accuracy.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs text-gray-400">
                  Start Date *
                </Label>
                <Select value={startDate} onValueChange={handleStartDateChange}>
                  <SelectTrigger
                    className={`bg-gray-900 border-gray-700 text-white ${
                      errors.startDate || errors.dateRange ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 max-h-60">
                    {Array.from({ length: 60 }, (_, i) => {
                      const date = new Date()
                      date.setMonth(date.getMonth() - i)
                      const value = date.toISOString().slice(0, 7)
                      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      return (
                        <SelectItem key={value} value={value} className="text-white hover:bg-gray-800">
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.startDate && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs text-gray-400">
                  End Date *
                </Label>
                <Select value={endDate} onValueChange={handleEndDateChange}>
                  <SelectTrigger
                    className={`bg-gray-900 border-gray-700 text-white ${
                      errors.endDate || errors.dateRange ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select end month" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 max-h-60">
                    {Array.from({ length: 60 }, (_, i) => {
                      const date = new Date()
                      date.setMonth(date.getMonth() - i)
                      const value = date.toISOString().slice(0, 7)
                      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      const startDateObj = startDate ? new Date(startDate + "-01") : null
                      const currentDateObj = new Date(value + "-01")
                      const isDisabled = startDateObj && currentDateObj < startDateObj

                      return (
                        <SelectItem
                          key={value}
                          value={value}
                          disabled={isDisabled}
                          className="text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.endDate && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {errors.dateRange && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dateRange}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-400">Query Frequency:</Label>
              <Select value={queryFrequency} onValueChange={setQueryFrequency}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="monthly" className="text-white hover:bg-gray-800">
                    Monthly
                  </SelectItem>
                  <SelectItem value="biannual" className="text-white hover:bg-gray-800">
                    Biannual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating & Generating Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Trend Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
