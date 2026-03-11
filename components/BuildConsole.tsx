"use client"

import { useEffect, useRef } from "react"

interface BuildConsoleProps {
  logs: string[]
  active: boolean
}

export default function BuildConsole({ logs, active }: BuildConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  if (!active && logs.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Build Console</h3>
        {active && (
          <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto max-h-80">
        {logs.length === 0 ? (
          <span className="text-gray-500">Waiting for output…</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all leading-5">
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
