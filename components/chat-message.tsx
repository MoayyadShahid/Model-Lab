import { User, Bot, Copy, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import type { Message } from "@/lib/types"
import { LoadingDots } from "@/components/loading-dots"
import { useState } from "react"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <div 
      className={`py-6 px-4 ${isUser ? "rounded-lg" : "bg-white"}`}
      style={isUser ? { backgroundColor: '#F6CEFC' } : undefined}
    >
      <div className="flex gap-4">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={isUser ? "bg-white border-2 border-black" : "bg-[#7A4BE3]"}>
            {isUser ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-white" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-gray-900">{isUser ? "You" : "Assistant"}</span>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-gray-900 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {isUser ? (
              <p className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{message.content}</p>
            ) : message.content === "__LOADING__" ? (
              <div className="py-2">
                <LoadingDots />
              </div>
            ) : (
              <>
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      // Determine if code is inline: block code has a language class (language-*), inline code doesn't
                      const isInline = !className || !className.includes('language-');
                      
                      return !isInline ? (
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 max-w-full break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          <code className="break-words whitespace-pre-wrap" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }} {...props}>{String(children).replace(/\n$/, "")}</code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-words" {...props}>
                          {children}
                        </code>
                      )
                    },
                    h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#7A4BE3] pl-4 my-4 italic text-gray-700">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
                {/* Copy button positioned in bottom right, above usage statistics */}
                <div className="flex justify-end -mt-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    onClick={handleCopy}
                    title={copied ? "Copied!" : "Copy"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {message.usage && (
                  <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="flex items-center gap-2">
                        <span className="font-semibold">Usage Statistics</span>
                        <span className="text-gray-400">({message.usage.total_tokens} tokens)</span>
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p><span className="font-medium">Model:</span> {message.usage.model}</p>
                            <p><span className="font-medium">Input tokens:</span> {message.usage.prompt_tokens}</p>
                            <p><span className="font-medium">Output tokens:</span> {message.usage.completion_tokens}</p>
                            <p><span className="font-medium">Total tokens:</span> {message.usage.total_tokens}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Input cost:</span> ${message.usage.cost.input_cost_usd.toFixed(6)}</p>
                            <p><span className="font-medium">Output cost:</span> ${message.usage.cost.output_cost_usd.toFixed(6)}</p>
                            <p><span className="font-medium">Total cost:</span> ${message.usage.cost.total_cost_usd.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
