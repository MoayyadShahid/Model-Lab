"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChatMessage } from "@/components/chat-message"
import type { Chat } from "@/app/page"

const modelGroups = [
  {
    provider: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    ],
  },
  {
    provider: "Anthropic",
    models: [
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-opus", name: "Claude 3 Opus" },
      { id: "claude-3-haiku", name: "Claude 3 Haiku" },
    ],
  },
  {
    provider: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat" },
      { id: "deepseek-coder", name: "DeepSeek Coder" },
    ],
  },
]

interface ChatInterfaceProps {
  chat?: Chat
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void
}

export function ChatInterface({ chat, onUpdateChat }: ChatInterfaceProps) {
  const [input, setInput] = useState("")

  // Get the selected model name for display
  const getSelectedModelName = () => {
    if (!chat) return "Select Model"
    for (const group of modelGroups) {
      const model = group.models.find((m) => m.id === chat.model)
      if (model) return model.name
    }
    return "Select Model"
  }

  const handleSend = () => {
    if (!input.trim() || !chat) return

    const newMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    }

    const updatedMessages = [...chat.messages, newMessage]

    // Update chat title if it's the first message
    const updates: Partial<Chat> = {
      messages: updatedMessages,
    }

    if (chat.title === "New Chat" && input.length > 0) {
      updates.title = input.length > 50 ? input.substring(0, 50) + "..." : input
    }

    onUpdateChat(chat.id, updates)
    setInput("")

    // Mock assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content:
          "I understand your question. This is a mock response from the selected model. In the actual implementation, this would be a real response from the AI model.",
        timestamp: new Date(),
      }
      onUpdateChat(chat.id, {
        messages: [...updatedMessages, assistantMessage],
      })
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleModelChange = (modelId: string) => {
    if (chat) {
      onUpdateChat(chat.id, { model: modelId })
    }
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.png" alt="Model Lab Logo" width={64} height={64} className="rounded-lg" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Chat Selected</h2>
          <p className="text-gray-600">Select a chat from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 w-full">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 border border-gray-300 hover:bg-gray-100"
            onClick={() => {
              // This will toggle the sidebar
              document.querySelector('[data-sidebar="trigger"]')?.click()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="9" x2="9" y1="9" y2="15" />
              <line x1="15" x2="15" y1="9" y2="15" />
            </svg>
          </Button>
          <SidebarTrigger className="sr-only" />
          <h1 className="text-lg font-semibold text-gray-900">Model Lab</h1>
        </div>

        <Select value={chat.model} onValueChange={handleModelChange}>
          <SelectTrigger className="w-48 bg-transparent">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {modelGroups.map((group) => (
              <SelectGroup key={group.provider}>
                <SelectLabel>{group.provider}</SelectLabel>
                {group.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto w-full">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-md w-full">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Image src="/logo.png" alt="Model Lab Logo" width={64} height={64} className="rounded-lg" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a New Conversation</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Ask anything and I'll help you explore ideas with the power of AI. Choose your model and begin!
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            <div className="w-full px-4 py-2">
              {chat.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10 flex-shrink-0 w-full">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-[60px] max-h-[200px] pr-12 resize-none border-gray-300 focus:border-[#7A4BE3] focus:ring-[#7A4BE3] w-full"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="sm"
              className="absolute bottom-2 right-2 bg-[#7A4BE3] hover:bg-[#6A3BD3] text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 flex-wrap gap-2">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Using {getSelectedModelName()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
