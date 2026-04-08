"use client"

import { BLOCK_DEFS, CATEGORY_COLORS, BlockCategory } from "@/lib/pipeline"
import { nodeIcon } from "./nodeIcons"

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  git:      "Git",
  bun:      "Bun",
  npm:      "npm",
  yarn:     "Yarn",
  go:       "Go",
  shell:    "Shell",
  artifact: "Artifact",
}

const CATEGORY_ORDER: BlockCategory[] = ["git", "shell", "bun", "npm", "yarn", "go", "artifact"]

// Grouped at module level — BLOCK_DEFS is static, no need to recompute per render
const GROUPED = CATEGORY_ORDER.reduce<Record<string, typeof BLOCK_DEFS>>((acc, cat) => {
  acc[cat] = BLOCK_DEFS.filter((d) => d.category === cat)
  return acc
}, {})

interface Props {
  onAddBlock: (type: string) => void
}

export default function BlockPalette({ onAddBlock }: Props) {

  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r py-4
                    border-gray-100 bg-white
                    dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider
                    text-gray-400 dark:text-gray-500">
        Blocks
      </p>
      {CATEGORY_ORDER.map((cat) => {
        const blocks = GROUPED[cat]
        if (!blocks?.length) return null
        const colors = CATEGORY_COLORS[cat]
        return (
          <div key={cat} className="mb-4">
            <p className="mb-1.5 px-4 text-[10px] font-medium uppercase tracking-wider
                          text-gray-400 dark:text-gray-500">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-1 px-2">
              {blocks.map((def) => {
                const Icon = nodeIcon(def.type)
                return (
                  <button
                    key={def.type}
                    onClick={() => onAddBlock(def.type)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors hover:shadow-sm
                                ${colors.border} bg-white hover:${colors.bg}
                                dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`h-4 w-4 ${colors.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">{def.label}</p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">{def.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
