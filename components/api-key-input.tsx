"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Key } from "lucide-react"

interface ApiKeyInputProps {
  modelId: string
  modelName: string
  onKeyChange: (modelId: string, key: string) => void
  apiKey?: string
}

export function ApiKeyInput({ modelId, modelName, onKeyChange, apiKey }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false)
  const [inputValue, setInputValue] = useState(apiKey || "")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onKeyChange(modelId, e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${modelId}-key`} className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Key className="w-3.5 h-3.5" />
        {modelName} API Key
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={`${modelId}-key`}
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={handleChange}
            placeholder={`Enter your ${modelName} API key`}
            className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Your API key is only used for this session and never stored on our servers.
      </p>
    </div>
  )
}
