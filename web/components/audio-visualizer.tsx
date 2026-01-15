"use client"

import { useEffect, useState } from "react"

interface AudioVisualizerProps {
  isActive: boolean
  size?: "sm" | "lg"
}

export function AudioVisualizer({ isActive, size = "sm" }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>([])

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        const newBars = Array.from({ length: size === "lg" ? 20 : 8 }, () => Math.random() * 100)
        setBars(newBars)
      }, 100)

      return () => clearInterval(interval)
    } else {
      setBars([])
    }
  }, [isActive, size])

  const barHeight = size === "lg" ? "h-8" : "h-4"
  const barWidth = size === "lg" ? "w-1" : "w-0.5"

  return (
    <div className={`flex items-end space-x-0.5 ${size === "lg" ? "h-8" : "h-4"}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`${barWidth} bg-gradient-to-t from-purple-500 to-orange-500 transition-all duration-100 ease-out rounded-full`}
          style={{ height: `${Math.max(height, 10)}%` }}
        />
      ))}
    </div>
  )
}
