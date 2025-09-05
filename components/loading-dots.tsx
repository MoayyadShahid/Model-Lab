"use client"

import { cn } from "@/lib/utils"
import React from "react"
import styles from "@/styles/loading.module.css"

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn(styles.loadingDots, className)}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  )
}
