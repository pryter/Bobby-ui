"use client"

import { Handle, Position, NodeProps } from "@xyflow/react"
import { BLOCK_DEF_MAP, CATEGORY_COLORS, PipelineNode } from "@/lib/pipeline"
import { nodeIcon } from "../nodeIcons"

interface BlockNodeData {
  node: PipelineNode
  onSelect?: (id: string) => void
}

export default function BlockNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BlockNodeData
  const node = nodeData.node
  const def = BLOCK_DEF_MAP[node.type]
  const cat = def?.category ?? "shell"
  const colors = CATEGORY_COLORS[cat]
  const Icon = nodeIcon(node.type)

  // Summary line: show key config value if present
  let summary = def?.description ?? node.type
  if (def?.configFields?.[0]) {
    const val = node.config?.[def.configFields[0].key]
    if (val) summary = val
  }

  return (
    <div
      className={`relative w-52 overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? "border-gray-400 shadow-md" : "border-gray-200"
      }`}
    >
      {/* Category accent bar */}
      <div className={`absolute inset-y-0 left-0 w-1 ${colors.dot}`} />

      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      <div className="px-4 py-3 pl-5">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">{node.label}</p>
            <p className="truncate text-xs text-gray-400">{summary}</p>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </div>
  )
}
