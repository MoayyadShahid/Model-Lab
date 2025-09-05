"use client"

import { cn } from "@/lib/utils"
import React from "react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3"
  }
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "rounded-full border-t-transparent border-[#7A4BE3] animate-spin", 
        sizeClasses[size]
      )} />
    </div>
  )
}

