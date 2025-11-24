"use client"

import type React from "react"
import { Plus, User, MoreHorizontal, Trash2, Edit3, Calendar } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Chat } from "@/lib/types"
import Image from "next/image"

interface AppSidebarProps {
  chats: Chat[]
  activeChatId: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
}

// Helper function to get model color based on model ID
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

const getModelColorClass = (modelId: string): string => {
  const color = getModelColor(modelId)
  switch(color) {
    case "green": return "bg-green-100 text-green-700"
    case "amber": return "bg-orange-100 text-orange-700"
    case "blue": return "bg-blue-100 text-blue-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

const getModelDisplayName = (modelId: string) => {
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
    "openai/o1-pro": "o1 Pro",
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
    
    // Legacy mappings without provider prefix
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet",
    "claude-3-opus": "Claude 3 Opus",
    "claude-3-haiku": "Claude 3 Haiku",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-coder": "DeepSeek Coder",
  }
  return modelNames[modelId] || modelId
}

const organizeChats = (chats: Chat[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  return {
    today: chats.filter((chat) => chat.createdAt >= today),
    yesterday: chats.filter((chat) => chat.createdAt >= yesterday && chat.createdAt < today),
    thisWeek: chats.filter((chat) => chat.createdAt >= weekAgo && chat.createdAt < yesterday),
    older: chats.filter((chat) => chat.createdAt < weekAgo),
  }
}

function ChatHistorySection({
  title,
  chats,
  icon,
  activeChatId,
  onSelectChat,
}: {
  title: string
  chats: Chat[]
  icon: React.ReactNode
  activeChatId: string
  onSelectChat: (chatId: string) => void
}) {
  if (chats.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        {icon}
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId
          const preview = chat.messages.length > 0 ? chat.messages[0].content : "Start a new conversation..."

          return (
            <div
              key={chat.id}
              className={`group relative mx-2 rounded-lg transition-colors duration-150 cursor-pointer ${
                isActive ? "bg-[#7A4BE3]/10 border border-[#7A4BE3]/20" : "hover:bg-gray-50"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-start gap-3 p-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    isActive ? "bg-[#7A4BE3]" : "bg-[#7A4BE3] opacity-60"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <h4
                      className={`text-sm font-medium truncate pr-8 ${isActive ? "text-[#7A4BE3]" : "text-gray-900"}`}
                    >
                      {chat.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{preview}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getModelColorClass(chat.model)}`}
                    >
                      {getModelDisplayName(chat.model)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover actions */}
              <div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="text-xs">
                      <Edit3 className="w-3 h-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-red-600">
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AppSidebar({ chats, activeChatId, onNewChat, onSelectChat }: AppSidebarProps) {
  const organizedChats = organizeChats(chats)

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-gray-200 bg-white w-80 h-screen flex-shrink-0">
      <SidebarHeader className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image src="/logo.png" alt="Model Lab Logo" width={32} height={32} className="rounded-lg" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Model Lab</h1>
            <p className="text-xs text-gray-500">All-in-One LLM Hub</p>
          </div>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-[#7A4BE3] to-[#9333EA] hover:from-[#6A3BD3] hover:to-[#8B2FC7] text-white shadow-sm transition-all duration-200 hover:shadow-md"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 overflow-y-auto flex-1">
        <ChatHistorySection
          title="Today"
          chats={organizedChats.today}
          icon={<Calendar className="w-3 h-3 text-gray-400" />}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
        />
        <ChatHistorySection
          title="Yesterday"
          chats={organizedChats.yesterday}
          icon={<Calendar className="w-3 h-3 text-gray-400" />}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
        />
        <ChatHistorySection
          title="This Week"
          chats={organizedChats.thisWeek}
          icon={<Calendar className="w-3 h-3 text-gray-400" />}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
        />
        {organizedChats.older.length > 0 && (
          <ChatHistorySection
            title="Older"
            chats={organizedChats.older}
            icon={<Calendar className="w-3 h-3 text-gray-400" />}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-[#7A4BE3] to-[#9333EA] text-white text-sm font-medium">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">Alex Chen</div>
            <div className="text-xs text-gray-500">Free Plan • 15 chats left</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Upgrade Plan</DropdownMenuItem>
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
