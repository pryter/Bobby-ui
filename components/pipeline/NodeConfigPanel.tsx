"use client"

import { BLOCK_DEF_MAP, CATEGORY_COLORS, PipelineNode } from "@/lib/pipeline"
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline"
import { nodeIcon } from "./nodeIcons"

interface Props {
  node: PipelineNode
  onChange: (id: string, patch: Partial<PipelineNode>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function NodeConfigPanel({ node, onChange, onDelete, onClose }: Props) {
  const def = BLOCK_DEF_MAP[node.type]
  const cat = def?.category ?? "shell"
  const colors = CATEGORY_COLORS[cat]
  const Icon = nodeIcon(node.type)

  if (!def) return null

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l
                    border-gray-100 bg-white
                    dark:border-white/[0.08] dark:bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3
                      border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
            <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{def.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{def.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 transition-colors
                     text-gray-400 hover:bg-gray-100 hover:text-gray-600
                     dark:text-gray-500 dark:hover:bg-white/[0.08] dark:hover:text-white"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Label field */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => onChange(node.id, { label: e.target.value })}
            className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors
                       border-gray-200 bg-white text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200
                       dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:border-white/[0.20] dark:focus:ring-white/[0.10]"
          />
        </div>

        {/* Config fields */}
        {def.configFields.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Configuration
            </p>
            {def.configFields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={node.config?.[field.key] ?? ""}
                  onChange={(e) =>
                    onChange(node.id, {
                      config: { ...(node.config ?? {}), [field.key]: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border px-3 py-1.5 font-mono text-sm outline-none transition-colors
                             border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200
                             dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-600 dark:focus:border-white/[0.20] dark:focus:ring-white/[0.10]"
                />
              </div>
            ))}
          </div>
        )}

        {def.configFields.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No configuration required for this block.
          </p>
        )}
      </div>

      {/* Delete */}
      {node.type !== "trigger" && (
        <div className="border-t px-4 py-3
                        border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={() => onDelete(node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-1.5 text-sm transition-colors
                       border-red-200 text-red-500 hover:bg-red-50
                       dark:border-red-500/25 dark:text-red-400 dark:hover:bg-red-500/[0.08]"
          >
            <TrashIcon className="h-4 w-4" />
            Remove block
          </button>
        </div>
      )}
    </div>
  )
}
