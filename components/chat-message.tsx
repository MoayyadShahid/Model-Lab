import { User, Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`py-6 px-4 ${isUser ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto flex gap-4">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={isUser ? "bg-gray-600" : "bg-[#7A4BE3]"}>
            {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
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

          <div className="prose prose-sm max-w-none text-gray-900">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    return !inline ? (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                        <code {...props}>{String(children).replace(/\n$/, "")}</code>
                      </pre>
                    ) : (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  },
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-4 list-decimal">{children}</ol>, // Added closing tag
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
