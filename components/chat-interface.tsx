"use client"

import type React from "react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import type { Message, Chat } from "@/lib/types"
import { Send, PanelLeft, PanelRightClose, MoreVertical, Trash2, LogOut } from "lucide-react"
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
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ChatMessage } from "@/components/chat-message"
import { supabase } from "@/lib/supabase"
import { LoadingDots } from "@/components/loading-dots"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea"

// Array of welcome messages for new chats
const welcomeMessages = [
  "What's on the agenda today?",
  "How can I assist you today?",
  "What would you like to explore?",
  "What can I help you with?",
  "Ready when you are. What's on your mind?",
  "What questions can I answer for you?",
  "What would you like to discuss today?",
  "I'm all ears! What do you need?",
  "What are we working on today?",
  "How can I make your day easier?"
]

// Helper function to get display name for models
const getModelDisplayName = (modelId: string): string => {
  const modelNames: Record<string, string> = {
    // OpenAI GPT-5 Series
    "openai/gpt-5.1": "GPT-5.1",
    "openai/gpt-5.1-chat": "GPT-5.1 Chat",
    "openai/gpt-5.1-codex": "GPT-5.1 Codex",
    "openai/gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
    "openai/gpt-5-codex": "GPT-5 Codex",
    "openai/gpt-5-chat": "GPT-5 Chat",
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-mini": "GPT-5 Mini",
    "openai/gpt-5-nano": "GPT-5 Nano",
    
    // OpenAI o-Series (Reasoning Models)
    "openai/o4-mini-deep-research": "o4 Mini Deep Research",
    "openai/o3": "o3",
    "openai/o4-mini": "o4 Mini",
    "openai/o3-mini-high": "o3 Mini High",
    "openai/o3-mini": "o3 Mini",
    "openai/o1": "o1",
    

    // OpenAI GPT-4.1 Series
    "openai/gpt-4.1": "GPT-4.1",
    "openai/gpt-4.1-mini": "GPT-4.1 Mini",
    "openai/gpt-4.1-nano": "GPT-4.1 Nano",
    
    // OpenAI GPT-4o Series
    "openai/gpt-4o-mini": "GPT-4o Mini",
    "openai/gpt-4o": "GPT-4o",
    
    // OpenAI GPT-4 Series
    "openai/gpt-4": "GPT-4",
    
    // OpenAI GPT OSS Series
    "openai/gpt-oss-120b": "GPT OSS 120B",
    "openai/gpt-oss-20b:free": "GPT OSS 20B (Free)",
    "openai/gpt-oss-20b": "GPT OSS 20B",
    
    // Anthropic Claude Models
    "anthropic/claude-sonnet-4.5": "Claude Sonnet 4.5",
    "anthropic/claude-sonnet-4": "Claude Sonnet 4",
    "anthropic/claude-haiku-4.5": "Claude Haiku 4.5",
    "anthropic/claude-3.7-sonnet": "Claude 3.7 Sonnet",
    "anthropic/claude-3.5-haiku": "Claude 3.5 Haiku",
    "anthropic/claude-opus-4.1": "Claude Opus 4.1",
    "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "anthropic/claude-3.7-sonnet:thinking": "Claude 3.7 Sonnet (Thinking)",
    "anthropic/claude-opus-4": "Claude Opus 4",
    "anthropic/claude-3-opus": "Claude 3 Opus",
    "anthropic/claude-3-sonnet": "Claude 3 Sonnet",
    "anthropic/claude-3-haiku": "Claude 3 Haiku",
    
    // DeepSeek Models
    "deepseek/deepseek-chat-v3-0324": "DeepSeek V3 0324",
    "deepseek/deepseek-chat-v3.1": "DeepSeek V3.1",
    "tngtech/deepseek-r1t2-chimera:free": "DeepSeek R1T2 Chimera (Free)",
    "deepseek/deepseek-v3.2-exp": "DeepSeek V3.2 Exp",
    "deepseek/deepseek-v3.1-terminus": "DeepSeek V3.1 Terminus",
    "deepseek/deepseek-r1-0528": "DeepSeek R1 0528",
    "tngtech/deepseek-r1t-chimera:free": "DeepSeek R1T Chimera (Free)",
    "deepseek/deepseek-chat": "DeepSeek V3",
    "deepseek/deepseek-chat-v3-0324:free": "DeepSeek V3 0324 (Free)",
    "tngtech/deepseek-r1t2-chimera": "DeepSeek R1T2 Chimera",
    "deepseek/deepseek-r1-0528:free": "DeepSeek R1 0528 (Free)",
    "deepseek/deepseek-r1": "DeepSeek R1",
    "deepseek/deepseek-r1:free": "DeepSeek R1 (Free)",
    
    // Legacy mappings without provider prefix
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet",
    "claude-3-opus": "Claude 3 Opus",
    "deepseek-chat": "DeepSeek Chat",
  }
  
  return modelNames[modelId] || modelId
}

// Helper function to get model color
const getModelColor = (modelId: string): string => {
  if (modelId.includes("gpt") || modelId.includes("openai") || modelId.startsWith("o")) {
    return "green"
  } else if (modelId.includes("claude")) {
    return "amber"
  } else if (modelId.includes("deepseek")) {
    return "blue"
  }
  return "gray"
}

interface ChatInterfaceProps {
  chat?: Chat
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
  onChangeActiveChat: (chatId: string) => void
  onValidateMessages?: (chatId: string) => Promise<boolean>
  chats: Chat[]
  user: any
}

export function ChatInterface({ 
  chat, 
  onUpdateChat, 
  onCreateChat, 
  onDeleteChat, 
  onChangeActiveChat,
  onValidateMessages,
  chats,
  user 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [welcomeMessage] = useState<string>(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const loadingMessageIdRef = useRef<string | null>(null)
  const { state: sidebarState, toggleSidebar } = useSidebar()
  const sidebarVisible = sidebarState === "expanded"

  // Removed message flow tracking - too verbose

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    if (chat?.messages.length) {
      scrollToBottom()
    }
  }, [chat?.messages.length])

  const handleSend = async () => {
    if (!input.trim() || !chat) return

    // Generate stable IDs using crypto if available, fallback to timestamp
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const updatedMessages = [...chat.messages, userMessage]

    // Update chat title if it's the first message
    const updates: Partial<Chat> = {
      messages: updatedMessages,
    }

    if (chat.title === "New Chat" && input.length > 0) {
      updates.title = input.length > 50 ? input.substring(0, 50) + "..." : input
    }

    console.log("Sending user message to updateChat:", userMessage.id);

    onUpdateChat(chat.id, updates)
    setInput("")

    // Add loading message with temporary ID
    const loadingMessageId = `loading-${Date.now()}`
    loadingMessageIdRef.current = loadingMessageId
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: "assistant",
      content: "__LOADING__",
      timestamp: new Date(),
    }
    
    console.log("Adding loading message:", loadingMessageId);
    
    // Update UI with loading message
    onUpdateChat(chat.id, {
      messages: [...updatedMessages, loadingMessage]
    })
    
    try {
      setIsLoading(true)
      
      // Format messages for the API (exclude loading markers)
      const messagesToSend = updatedMessages
        .filter(msg => msg.content !== "__LOADING__" && !msg.id.startsWith('loading-'))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      
      // Call the streaming API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat.id,
          messages: messagesToSend,
          model: chat.model,
          stream: true
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      let finalContent = ''
      let usageData: any = null
      
      // Check if response is streaming
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (!reader) {
          throw new Error('No response body')
        }
        
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              
              if (dataStr.trim() === '[DONE]') continue
              
              try {
                const data = JSON.parse(dataStr)
                
                if (data.error) {
                  throw new Error(data.error)
                }
                
                if (data.type === 'content' && data.content) {
                  finalContent += data.content
                  
                  // Update loading message with current content for real-time display
                  const streamingMessage: Message = {
                    ...loadingMessage,
                    content: finalContent
                  }
                  
                  onUpdateChat(chat.id, {
                    messages: [...updatedMessages, streamingMessage]
                  })
                } else if (data.type === 'usage' && data.usage) {
                  usageData = data.usage
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json()
        finalContent = data.message.content
        usageData = data.usage
      }
      
      // Create final message with stable ID
      const finalMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: finalContent || "No response received",
        timestamp: new Date(),
        usage: usageData || undefined
      }
      
      console.log("Sending final assistant message to updateChat:", finalMessage.id);
      
      // Replace loading message with final message (single update)
      loadingMessageIdRef.current = null
      onUpdateChat(chat.id, {
        messages: [...updatedMessages, finalMessage]
      })
      
      // Validate message persistence after a short delay
      if (onValidateMessages) {
        setTimeout(() => {
          onValidateMessages(chat.id);
        }, 2000); // Give time for database operations to complete
      }
      
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Create error message
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      
      loadingMessageIdRef.current = null
      onUpdateChat(chat.id, {
        messages: [...updatedMessages, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
          <Button 
            onClick={onCreateChat} 
            className="mt-4 bg-gradient-to-r from-[#7A4BE3] to-[#9333EA] hover:from-[#6A3BD3] hover:to-[#8B2FC7]"
          >
            Create New Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${sidebarVisible ? 'grid-cols-[280px_1fr]' : 'grid-cols-[0px_1fr]'} h-screen transition-all duration-300`}>
      {/* Sidebar */}
      <div className={`h-screen overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ${sidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/logo.png" alt="Model Lab Logo" width={32} height={32} className="rounded-lg" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Model Lab</h1>
                <p className="text-xs text-gray-500">All-in-One LLM Hub</p>
              </div>
            </div>
            <button
              onClick={onCreateChat}
              className="w-full bg-gradient-to-r from-[#7A4BE3] to-[#9333EA] hover:from-[#6A3BD3] hover:to-[#8B2FC7] text-white shadow-sm transition-all duration-200 hover:shadow-md py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Chat
            </button>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2">
            {chats.map(chatItem => (
              <div 
                key={chatItem.id}
                onClick={() => onChangeActiveChat(chatItem.id)}
                className={`p-3 rounded-lg mb-2 cursor-pointer w-full ${chatItem.id === chat.id ? 'bg-[#7A4BE3]/10 border border-[#7A4BE3]/20' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3 relative group">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${chatItem.id === chat.id ? 'bg-[#7A4BE3]' : 'bg-[#7A4BE3] opacity-60'}`} />
                  <div className="w-full min-w-0">
                    <h4 className={`text-sm font-medium mb-1 truncate ${chatItem.id === chat.id ? 'text-[#7A4BE3]' : 'text-gray-900'}`}>
                      {chatItem.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {chatItem.messages[0]?.content || "Start a new conversation..."}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 min-w-[120px] max-w-full justify-start
                      ${getModelColor(chatItem.model) === "green" ? "bg-green-100 text-green-700" :
                        getModelColor(chatItem.model) === "amber" ? "bg-amber-100 text-amber-700" :
                        getModelColor(chatItem.model) === "blue" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${getModelColor(chatItem.model) === "green" ? "bg-green-500" :
                          getModelColor(chatItem.model) === "amber" ? "bg-amber-500" :
                          getModelColor(chatItem.model) === "blue" ? "bg-blue-500" :
                          "bg-gray-400"
                        }`} />
                      <span className="truncate">
                        {getModelDisplayName(chatItem.model)}
                      </span>
                    </span>
                  </div>
                  
                  {/* 3-dot menu button */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() => onDeleteChat(chatItem.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A4BE3] to-[#9333EA] flex items-center justify-center text-white">
                {user?.email ? user.email.substring(0, 1).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || "User"}
                </div>
                <div className="text-xs text-gray-500">Model Lab Account</div>
              </div>
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="w-full px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleSidebar} 
                  className="h-8 w-8 p-0 border border-gray-300 hover:bg-gray-100 rounded-md flex items-center justify-center"
                  aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarVisible ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelRightClose className="h-4 w-4" />
                  )}
                </button>
                <SidebarTrigger className="sr-only" />
                <h1 className="text-lg font-semibold text-gray-900">Model Lab</h1>
              </div>
              
              <Select
                value={chat.model}
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="w-48 bg-transparent border-gray-300">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      getModelColor(chat.model) === "green" ? "bg-green-500" :
                      getModelColor(chat.model) === "amber" ? "bg-amber-500" :
                      getModelColor(chat.model) === "blue" ? "bg-blue-500" :
                      "bg-gray-400"
                    }`} />
                    <SelectValue placeholder="Select a model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - GPT-5 Series</span>
                    </SelectLabel>
                    <SelectItem value="openai/gpt-5.1" className="pl-10">GPT-5.1</SelectItem>
                    <SelectItem value="openai/gpt-5.1-chat" className="pl-10">GPT-5.1 Chat</SelectItem>
                    <SelectItem value="openai/gpt-5.1-codex" className="pl-10">GPT-5.1 Codex</SelectItem>
                    <SelectItem value="openai/gpt-5.1-codex-mini" className="pl-10">GPT-5.1 Codex Mini</SelectItem>
                    <SelectItem value="openai/gpt-5" className="pl-10">GPT-5</SelectItem>
                    <SelectItem value="openai/gpt-5-codex" className="pl-10">GPT-5 Codex</SelectItem>
                    <SelectItem value="openai/gpt-5-chat" className="pl-10">GPT-5 Chat</SelectItem>
                    <SelectItem value="openai/gpt-5-mini" className="pl-10">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5-nano" className="pl-10">GPT-5 Nano</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - o-Series (Reasoning)</span>
                    </SelectLabel>
                    <SelectItem value="openai/o3-deep-research" className="pl-10">o3 Deep Research</SelectItem>
                    <SelectItem value="openai/o3" className="pl-10">o3</SelectItem>
                    <SelectItem value="openai/o3-mini-high" className="pl-10">o3 Mini High</SelectItem>
                    <SelectItem value="openai/o3-mini" className="pl-10">o3 Mini</SelectItem>
                    <SelectItem value="openai/o4-mini" className="pl-10">o4 Mini</SelectItem>
                    <SelectItem value="openai/o4-mini-deep-research" className="pl-10">o4 Mini Deep Research</SelectItem>
                    <SelectItem value="openai/o1" className="pl-10">o1</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - GPT-4.1 Series</span>
                    </SelectLabel>
                    <SelectItem value="openai/gpt-4.1" className="pl-10">GPT-4.1</SelectItem>
                    <SelectItem value="openai/gpt-4.1-mini" className="pl-10">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="openai/gpt-4.1-nano" className="pl-10">GPT-4.1 Nano</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - GPT-4o Series</span>
                    </SelectLabel>
                    <SelectItem value="openai/gpt-4o" className="pl-10">GPT-4o</SelectItem>
                    <SelectItem value="openai/gpt-4o-mini" className="pl-10">GPT-4o Mini</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - GPT-4 Series</span>
                    </SelectLabel>
                    <SelectItem value="openai/gpt-4" className="pl-10">GPT-4</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI - GPT OSS Series</span>
                    </SelectLabel>
                    <SelectItem value="openai/gpt-oss-120b" className="pl-10">GPT OSS 120B</SelectItem>
                    <SelectItem value="openai/gpt-oss-20b" className="pl-10">GPT OSS 20B</SelectItem>
                    <SelectItem value="openai/gpt-oss-20b:free" className="pl-10">GPT OSS 20B (Free)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700">Anthropic - Claude 4 Series</span>
                    </SelectLabel>
                    <SelectItem value="anthropic/claude-sonnet-4.5" className="pl-10">Claude Sonnet 4.5</SelectItem>
                    <SelectItem value="anthropic/claude-sonnet-4" className="pl-10">Claude Sonnet 4</SelectItem>
                    <SelectItem value="anthropic/claude-haiku-4.5" className="pl-10">Claude Haiku 4.5</SelectItem>
                    <SelectItem value="anthropic/claude-opus-4.1" className="pl-10">Claude Opus 4.1</SelectItem>
                    <SelectItem value="anthropic/claude-opus-4" className="pl-10">Claude Opus 4</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700">Anthropic - Claude 3.7 Series</span>
                    </SelectLabel>
                    <SelectItem value="anthropic/claude-3.7-sonnet" className="pl-10">Claude 3.7 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3.7-sonnet:thinking" className="pl-10">Claude 3.7 Sonnet (Thinking)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700">Anthropic - Claude 3.5 Series</span>
                    </SelectLabel>
                    <SelectItem value="anthropic/claude-3.5-sonnet" className="pl-10">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3.5-haiku" className="pl-10">Claude 3.5 Haiku</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700">Anthropic - Claude 3 Series</span>
                    </SelectLabel>
                    <SelectItem value="anthropic/claude-3-opus" className="pl-10">Claude 3 Opus</SelectItem>
                    <SelectItem value="anthropic/claude-3-haiku" className="pl-10">Claude 3 Haiku</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-blue-700">DeepSeek - V3 Series</span>
                    </SelectLabel>
                    <SelectItem value="deepseek/deepseek-chat" className="pl-10">DeepSeek V3</SelectItem>
                    <SelectItem value="deepseek/deepseek-chat-v3.1" className="pl-10">DeepSeek V3.1</SelectItem>
                    <SelectItem value="deepseek/deepseek-chat-v3-0324" className="pl-10">DeepSeek V3 0324</SelectItem>
                    <SelectItem value="deepseek/deepseek-v3.1-terminus" className="pl-10">DeepSeek V3.1 Terminus</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-blue-700">DeepSeek - R1 Series</span>
                    </SelectLabel>
                    <SelectItem value="deepseek/deepseek-r1" className="pl-10">DeepSeek R1</SelectItem>
                    <SelectItem value="deepseek/deepseek-r1-0528" className="pl-10">DeepSeek R1 0528</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-blue-700">TNG - DeepSeek Chimera</span>
                    </SelectLabel>
                    <SelectItem value="tngtech/deepseek-r1t2-chimera" className="pl-10">DeepSeek R1T2 Chimera</SelectItem>
                    <SelectItem value="tngtech/deepseek-r1t2-chimera:free" className="pl-10">DeepSeek R1T2 Chimera (Free)</SelectItem>
                    <SelectItem value="tngtech/deepseek-r1t-chimera:free" className="pl-10">DeepSeek R1T Chimera (Free)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 relative">
          <div className="w-full max-w-4xl mx-auto px-8 h-full">
            {chat.messages.length > 0 ? (
              <>
                {chat.messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-full w-full absolute top-0 left-0">
                <div className="text-center max-w-md bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 transform transition-all">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Image src="/logo.png" alt="Model Lab Logo" width={64} height={64} className="rounded-lg" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Welcome to Model Lab</h2>
                  <p className="text-lg text-[#7A4BE3] font-medium mb-6">
                    {welcomeMessage}
                  </p>
                  <p className="text-gray-600">
                    Type your message below to start a conversation with Katalyst.
                  </p>
                </div>
              </div>
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="w-full px-8">
            {/* Using the auto-resize textarea */}
            <div className="relative">
              <Textarea
                ref={useAutoResizeTextarea(input)}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="min-h-[80px] overflow-y-auto pr-12 resize-none w-full focus:ring-[#7A4BE3] focus:border-[#7A4BE3] transition-height duration-200"
                style={{ maxHeight: '200px' }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-[#7A4BE3] hover:bg-[#6A3BD3] rounded-md"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="w-full px-8 flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                getModelColor(chat.model) === "green" ? "bg-green-500" :
                getModelColor(chat.model) === "amber" ? "bg-amber-500" :
                getModelColor(chat.model) === "blue" ? "bg-blue-500" :
                "bg-gray-400"
              }`} />
              Using {getModelDisplayName(chat.model)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}