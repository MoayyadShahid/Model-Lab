import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Model Lab - All-in-one AI Model Hub",
  description: "Access every AI model in one place with Model Lab",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
