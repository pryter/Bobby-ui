"use client"

import { Handle, Position, NodeProps } from "@xyflow/react"
import { BoltIcon } from "@heroicons/react/24/solid"

export default function TriggerNode({ selected }: NodeProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm transition-shadow ${
        selected
          ? "border-violet-400 bg-violet-50 shadow-violet-100 dark:border-violet-400/60 dark:bg-violet-500/[0.12] dark:shadow-none"
          : "border-violet-300 bg-white dark:border-violet-400/30 dark:bg-violet-500/[0.06] dark:shadow-none"
      }`}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full
                      bg-violet-100 dark:bg-violet-500/20">
        <BoltIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
      </div>
      <span className="text-sm font-medium text-violet-700 dark:text-violet-200">Git Push</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-violet-400 dark:!border-[#0c0c0c]"
      />
    </div>
  )
}
