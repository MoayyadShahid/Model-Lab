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

interface ChatInterfaceProps {
  chat?: Chat
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
  onChangeActiveChat: (chatId: string) => void
  chats: Chat[]
  user: any
}

export function ChatInterface({ 
  chat, 
  onUpdateChat, 
  onCreateChat, 
  onDeleteChat, 
  onChangeActiveChat, 
  chats,
  user 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [welcomeMessage] = useState<string>(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { state: sidebarState, toggleSidebar } = useSidebar()
  const sidebarVisible = sidebarState === "expanded"

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

    const userMessage: Message = {
      id: Date.now().toString(),
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

    onUpdateChat(chat.id, updates)
    setInput("")

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
    }
    
    onUpdateChat(chat.id, {
      messages: [...updatedMessages, loadingMessage]
    })
    
    try {
      // Set loading state
      setIsLoading(true)
      
      // Format messages for the API
      const messagesToSend = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat.id,
          messages: messagesToSend,
          model: chat.model
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      
      // Create the assistant message with usage data
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(),
        usage: data.usage // Add the usage data from the API response
      }
      
      // Replace the loading message with the actual response
      const finalMessages = updatedMessages.concat(assistantMessage)
      
      onUpdateChat(chat.id, {
        messages: finalMessages,
      })
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Replace loading message with error
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      
      onUpdateChat(chat.id, {
        messages: updatedMessages.concat(errorMessage),
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
                      ${chatItem.model.startsWith("gpt") ? "bg-green-100 text-green-700" :
                        chatItem.model.startsWith("claude") ? "bg-amber-100 text-amber-700" :
                        chatItem.model.startsWith("deepseek") ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${chatItem.model.startsWith("gpt") ? "bg-green-500" :
                          chatItem.model.startsWith("claude") ? "bg-amber-500" :
                          chatItem.model.startsWith("deepseek") ? "bg-blue-500" :
                          "bg-gray-400"
                        }`} />
                      <span className="truncate">
                        {chatItem.model === "gpt-4o" ? "GPT-4o" : 
                         chatItem.model === "gpt-4o-mini" ? "GPT-4o Mini" : 
                         chatItem.model === "claude-3-5-sonnet" ? "Claude 3.5 Sonnet" :
                         chatItem.model === "claude-3-opus" ? "Claude 3 Opus" :
                         chatItem.model === "deepseek-chat" ? "DeepSeek Chat" :
                         chatItem.model}
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
                      chat.model.startsWith("gpt") ? "bg-green-500" :
                      chat.model.startsWith("claude") ? "bg-amber-500" :
                      chat.model.startsWith("deepseek") ? "bg-blue-500" :
                      "bg-gray-400"
                    }`} />
                    <SelectValue placeholder="Select a model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-700">OpenAI</span>
                    </SelectLabel>
                    <SelectItem value="gpt-4o" className="pl-10">
                      <div className="flex items-center gap-2">
                        <span>GPT-4o</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-4o-mini" className="pl-10">
                      <div className="flex items-center gap-2">
                        <span>GPT-4o Mini</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700">Anthropic</span>
                    </SelectLabel>
                    <SelectItem value="claude-3-5-sonnet" className="pl-10">
                      <div className="flex items-center gap-2">
                        <span>Claude 3.5 Sonnet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="claude-3-opus" className="pl-10">
                      <div className="flex items-center gap-2">
                        <span>Claude 3 Opus</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-blue-700">DeepSeek</span>
                    </SelectLabel>
                    <SelectItem value="deepseek-chat" className="pl-10">
                      <div className="flex items-center gap-2">
                        <span>DeepSeek Chat</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 relative">
          <div className="w-full px-8 h-full">
            {chat.messages.length > 0 ? (
              <>
                {chat.messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="px-4 mb-10 flex items-center">
                    <div className="text-sm text-gray-500 mr-2">Katalyst is thinking</div>
                    <LoadingDots />
                  </div>
                )}
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
          <div className="w-full px-8 relative">
            {/* Using the auto-resize textarea */}
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
              className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-[#7A4BE3] hover:bg-[#6A3BD3]"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-full px-8 flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                chat.model.startsWith("gpt") ? "bg-green-500" :
                chat.model.startsWith("claude") ? "bg-amber-500" :
                chat.model.startsWith("deepseek") ? "bg-blue-500" :
                "bg-gray-400"
              }`} />
              Using {
                chat.model === "gpt-4o" ? "GPT-4o" : 
                chat.model === "gpt-4o-mini" ? "GPT-4o Mini" : 
                chat.model === "claude-3-5-sonnet" ? "Claude 3.5 Sonnet" :
                chat.model === "claude-3-opus" ? "Claude 3 Opus" :
                chat.model === "deepseek-chat" ? "DeepSeek Chat" :
                chat.model
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}