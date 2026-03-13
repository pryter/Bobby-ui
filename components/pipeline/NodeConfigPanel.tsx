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
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
            <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{def.label}</p>
            <p className="text-xs text-gray-400">{def.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Label field */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => onChange(node.id, { label: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
        </div>

        {/* Config fields */}
        {def.configFields.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Configuration</p>
            {def.configFields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500">
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 font-mono text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                />
              </div>
            ))}
          </div>
        )}

        {def.configFields.length === 0 && (
          <p className="text-xs text-gray-400">No configuration required for this block.</p>
        )}
      </div>

      {/* Delete */}
      {node.type !== "trigger" && (
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            onClick={() => onDelete(node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-1.5 text-sm text-red-500 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Remove block
          </button>
        </div>
      )}
    </div>
  )
}
