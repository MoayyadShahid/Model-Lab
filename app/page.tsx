"use client"

import { useState, useEffect, useRef } from "react"
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea"
import { formatMessage } from "@/lib/format-message"
import { LoadingDots } from "@/components/loading-dots"
import { LoadingSpinner } from "@/components/loading-spinner"

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
import { PanelLeft, PanelRightClose, MoreVertical, Trash2 } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatInterface } from "@/components/chat-interface"

export interface Chat {
  id: string
  title: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }>
  model: string
  createdAt: Date
}

export default function HomePage() {
  const [input, setInput] = useState<string>("")
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [welcomeMessage, setWelcomeMessage] = useState<string>(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "Machine Learning Basics",
      model: "gpt-4o",
      createdAt: new Date(Date.now() - 10000),
      messages: [
        {
          id: "1",
          role: "user",
          content: "Can you explain how machine learning works in simple terms?",
          timestamp: new Date(Date.now() - 10000),
        },
        {
          id: "2",
          role: "assistant",
          content: `Machine learning is like teaching a computer to recognize patterns and make predictions, similar to how humans learn from experience.

Here's a simple breakdown:

## How it works:
1. **Data Collection**: We feed the computer lots of examples (like thousands of photos of cats and dogs)
2. **Pattern Recognition**: The computer analyzes these examples to find patterns (cats have pointy ears, dogs come in more size variations, etc.)
3. **Learning**: The computer builds a "model" - essentially a set of rules based on these patterns
4. **Prediction**: When shown a new photo, the computer uses its learned rules to guess whether it's a cat or dog

## Real-world example:
Think of it like learning to drive:
- You observe many driving situations (data)
- You learn patterns (red light = stop, green = go)
- You build experience (your mental model)
- You apply this knowledge to new situations

The key difference is that computers can process vastly more data than humans and find patterns we might miss!`,
          timestamp: new Date(Date.now() - 5000),
        },
      ],
    },
  ])
  const [activeChatId, setActiveChatId] = useState<string>("1")

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      model: "gpt-4o",
      createdAt: new Date(),
    }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    // Set a new random welcome message
    setWelcomeMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)])
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates } : chat)))
  }
  
  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    // If the active chat is deleted, set the first available chat as active or create a new one
    if (chatId === activeChatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id)
      } else {
        createNewChat()
      }
    }
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId)
  
  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    if (activeChat?.messages.length) {
      scrollToBottom()
    }
  }, [activeChat?.messages.length])

  return (
    <div className={`grid ${sidebarVisible ? 'grid-cols-[280px_1fr]' : 'grid-cols-[0px_1fr]'} h-screen transition-all duration-300`}>
      {/* Sidebar */}
      <div className={`h-screen overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ${sidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Model Lab Logo" width={32} height={32} className="rounded-lg" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Model Lab</h1>
                <p className="text-xs text-gray-500">All-in-One LLM Hub</p>
              </div>
            </div>
            <button
              onClick={createNewChat}
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
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3 rounded-lg mb-2 cursor-pointer w-full ${chat.id === activeChatId ? 'bg-[#7A4BE3]/10 border border-[#7A4BE3]/20' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3 relative group">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${chat.id === activeChatId ? 'bg-[#7A4BE3]' : 'bg-[#7A4BE3] opacity-60'}`} />
                  <div className="w-full min-w-0">
                    <h4 className={`text-sm font-medium mb-1 truncate ${chat.id === activeChatId ? 'text-[#7A4BE3]' : 'text-gray-900'}`}>
                      {chat.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {chat.messages[0]?.content || "Start a new conversation..."}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 min-w-[120px] max-w-full justify-start
                      ${chat.model.startsWith("gpt") ? "bg-green-100 text-green-700" :
                        chat.model.startsWith("claude") ? "bg-amber-100 text-amber-700" :
                        chat.model.startsWith("deepseek") ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${chat.model.startsWith("gpt") ? "bg-green-500" :
                          chat.model.startsWith("claude") ? "bg-amber-500" :
                          chat.model.startsWith("deepseek") ? "bg-blue-500" :
                          "bg-gray-400"
                        }`} />
                      <span className="truncate">
                        {chat.model === "gpt-4o" ? "GPT-4o" : 
                         chat.model === "gpt-4o-mini" ? "GPT-4o Mini" : 
                         chat.model === "claude-3-5-sonnet" ? "Claude 3.5 Sonnet" :
                         chat.model === "claude-3-opus" ? "Claude 3 Opus" :
                         chat.model === "deepseek-chat" ? "DeepSeek Chat" :
                         chat.model}
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
                          onClick={() => deleteChat(chat.id)}
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
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A4BE3] to-[#9333EA] flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Alex Chen</div>
                <div className="text-xs text-gray-500">Free Plan • 15 chats left</div>
              </div>
              <button className="h-6 w-6 p-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className="flex flex-col h-screen overflow-hidden">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="max-w-4xl w-full mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSidebarVisible(!sidebarVisible)} 
                      className="h-8 w-8 p-0 border border-gray-300 hover:bg-gray-100 rounded-md flex items-center justify-center"
                      aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                    >
                      {sidebarVisible ? (
                        <PanelLeft className="h-4 w-4" />
                      ) : (
                        <PanelRightClose className="h-4 w-4" />
                      )}
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">Model Lab</h1>
                  </div>
                  
                  <Select
                value={activeChat.model}
                onValueChange={(value) => updateChat(activeChat.id, { model: value })}
              >
                <SelectTrigger className="w-48 bg-transparent border-gray-300">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeChat.model.startsWith("gpt") ? "bg-green-500" :
                      activeChat.model.startsWith("claude") ? "bg-amber-500" :
                      activeChat.model.startsWith("deepseek") ? "bg-blue-500" :
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 relative">
              <div className="max-w-4xl mx-auto h-full">
                {activeChat.messages.length > 0 ? (
                  <>
                    {activeChat.messages.map(message => (
                      <div key={message.id} className={`mb-10 max-w-full ${message.role === 'user' ? 'bg-blue-50 rounded-lg py-4 px-6 border border-blue-100' : 'px-4'}`}>
                        <div className="flex items-start overflow-hidden">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center mb-2">
                              <span className="font-medium text-sm">
                                {message.role === 'user' ? 'You' : 'Katalyst'}
                              </span>
                            </div>
                            <div className={`text-sm whitespace-pre-wrap prose prose-sm max-w-[95%] break-words ${message.role === 'user' ? 'prose-blue' : ''}`}>
                              {formatMessage(message.content).split('\n').map((paragraph, i) => (
                                paragraph.trim() ? (
                                  <p key={i} className={`${paragraph.startsWith('#') ? 'font-bold mt-3' : 'mb-2'} break-all hyphens-auto`}>
                                    {paragraph}
                                  </p>
                                ) : <br key={i} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="px-4 mb-10 flex items-center">
                        <div className="text-sm text-gray-500 mr-2">Katalyst is thinking</div>
                        <LoadingDots className="py-2" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full w-full absolute top-0 left-0">
                    <div className="text-center max-w-md bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100 transform transition-all">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <img src="/logo.png" alt="Model Lab Logo" width={64} height={64} className="rounded-lg" />
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
              <div className="max-w-4xl mx-auto relative">
                {/* Using the auto-resize textarea */}
                <Textarea
                  ref={useAutoResizeTextarea(input)}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        const newMessage = {
                          id: Date.now().toString(),
                          role: "user" as const,
                          content: input,
                          timestamp: new Date(),
                        };
                        updateChat(activeChat.id, {
                          messages: [...activeChat.messages, newMessage]
                        });
                        setInput("");
                        
                        // Set loading state to true
                        setIsLoading(true);
                        
                        // Call the OpenAI API through our backend
                        fetch('/api/chat', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            chat_id: activeChat.id,
                            messages: [...activeChat.messages, newMessage].map(msg => ({
                              role: msg.role,
                              content: msg.content
                            })),
                            model: activeChat.model
                          }),
                        })
                        .then(response => response.json())
                        .then(data => {
                          const aiMessage = {
                            id: (Date.now() + 1).toString(),
                            role: "assistant" as const,
                            content: data.message.content,
                            timestamp: new Date(),
                          };
                          updateChat(activeChat.id, {
                            messages: [...activeChat.messages, newMessage, aiMessage]
                          });
                          setIsLoading(false); // Set loading state to false when response arrives
                        })
                        .catch(error => {
                          console.error('Error:', error);
                          // Handle error - add an error message to the chat
                          const errorMessage = {
                            id: (Date.now() + 1).toString(),
                            role: "assistant" as const,
                            content: "Sorry, there was an error processing your request. Please try again.",
                            timestamp: new Date(),
                          };
                          updateChat(activeChat.id, {
                            messages: [...activeChat.messages, newMessage, errorMessage]
                          });
                          setIsLoading(false); // Set loading state to false on error
                        });
                      }
                    }
                  }}
                  placeholder="Ask anything..."
                  className="min-h-[80px] overflow-y-auto pr-12 resize-none w-full focus:ring-[#7A4BE3] focus:border-[#7A4BE3] transition-height duration-200"
                  style={{ maxHeight: '200px' }}
                />
                <Button
                  onClick={() => {
                    if (input.trim() && activeChat) {
                      const newMessage = {
                        id: Date.now().toString(),
                        role: "user" as const,
                        content: input,
                        timestamp: new Date(),
                      };
                      updateChat(activeChat.id, {
                        messages: [...activeChat.messages, newMessage]
                      });
                      setInput("");
                      
                      // Set loading state to true
                      setIsLoading(true);
                      
                      // Call the OpenAI API through our backend
                      fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          chat_id: activeChat.id,
                          messages: [...activeChat.messages, newMessage].map(msg => ({
                            role: msg.role,
                            content: msg.content
                          })),
                          model: activeChat.model
                        }),
                      })
                      .then(response => response.json())
                      .then(data => {
                        const aiMessage = {
                          id: (Date.now() + 1).toString(),
                          role: "assistant" as const,
                          content: data.message.content,
                          timestamp: new Date(),
                        };
                        updateChat(activeChat.id, {
                          messages: [...activeChat.messages, newMessage, aiMessage]
                        });
                        setIsLoading(false); // Set loading state to false when response arrives
                      })
                      .catch(error => {
                        console.error('Error:', error);
                        // Handle error - add an error message to the chat
                        const errorMessage = {
                          id: (Date.now() + 1).toString(),
                          role: "assistant" as const,
                          content: "Sorry, there was an error processing your request. Please try again.",
                          timestamp: new Date(),
                        };
                        updateChat(activeChat.id, {
                          messages: [...activeChat.messages, newMessage, errorMessage]
                        });
                        setIsLoading(false); // Set loading state to false on error
                      });
                    }
                  }}
                  disabled={!input.trim()}
                  className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-[#7A4BE3] hover:bg-[#6A3BD3]"
                  size="icon"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span className="sr-only">Send</span>
                </Button>
              </div>
              <div className="max-w-4xl mx-auto flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    activeChat.model.startsWith("gpt") ? "bg-green-500" :
                    activeChat.model.startsWith("claude") ? "bg-amber-500" :
                    activeChat.model.startsWith("deepseek") ? "bg-blue-500" :
                    "bg-gray-400"
                  }`} />
                  Using {
                    activeChat.model === "gpt-4o" ? "GPT-4o" : 
                    activeChat.model === "gpt-4o-mini" ? "GPT-4o Mini" : 
                    activeChat.model === "claude-3-5-sonnet" ? "Claude 3.5 Sonnet" :
                    activeChat.model === "claude-3-opus" ? "Claude 3 Opus" :
                    activeChat.model === "deepseek-chat" ? "DeepSeek Chat" :
                    activeChat.model
                  }
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <img src="/logo.png" alt="Model Lab Logo" width={64} height={64} className="rounded-lg" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Chat Selected</h2>
              <p className="text-gray-600">Select a chat from the sidebar or create a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
