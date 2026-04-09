"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DualScrollContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * A container that shows horizontal scroll bars at both top AND bottom
 * for easier navigation of wide content without scrolling down first.
 */
export function DualScrollContainer({ children, className }: DualScrollContainerProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const topBarRef = React.useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = React.useState(0)
  const [showScrollbars, setShowScrollbars] = React.useState(false)

  // Measure content width and check if scrollbars are needed
  React.useEffect(() => {
    const measureContent = () => {
      if (contentRef.current) {
        const scrollWidth = contentRef.current.scrollWidth
        const clientWidth = contentRef.current.clientWidth
        setContentWidth(scrollWidth)
        setShowScrollbars(scrollWidth > clientWidth)
      }
    }

    measureContent()

    // Re-measure on resize
    const observer = new ResizeObserver(measureContent)
    if (contentRef.current) {
      observer.observe(contentRef.current)
    }

    return () => observer.disconnect()
  }, [children])

  // Sync scroll positions between top bar and content
  const handleTopScroll = () => {
    if (contentRef.current && topBarRef.current) {
      contentRef.current.scrollLeft = topBarRef.current.scrollLeft
    }
  }

  const handleBottomScroll = () => {
    if (contentRef.current && topBarRef.current) {
      topBarRef.current.scrollLeft = contentRef.current.scrollLeft
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Top scroll bar - only visible when content overflows */}
      {showScrollbars && (
        <div
          ref={topBarRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto overflow-y-hidden mb-2"
          style={{ height: "12px" }}
        >
          <div style={{ width: contentWidth, height: 1 }} />
        </div>
      )}

      {/* Content with bottom scroll bar */}
      <div
        ref={contentRef}
        onScroll={handleBottomScroll}
        className="overflow-x-auto"
      >
        {children}
      </div>
    </div>
  )
}
