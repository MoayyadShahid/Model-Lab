import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Model Lab - Chat Interface",
  description: "Access and use multiple AI models in one interface",
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
