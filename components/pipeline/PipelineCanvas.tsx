"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Pipeline, PipelineEdge, PipelineNode, BLOCK_DEF_MAP, NodeType, buildDefaultPipeline } from "@/lib/pipeline"
import BlockNode from "./nodes/BlockNode"
import TriggerNode from "./nodes/TriggerNode"
import BlockPalette from "./BlockPalette"
import NodeConfigPanel from "./NodeConfigPanel"

// ── React Flow node type registry ─────────────────────────────────────────────

const NODE_TYPES = {
  blockNode: BlockNode,
  triggerNode: TriggerNode,
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function toRFNode(pn: PipelineNode): Node {
  return {
    id: pn.id,
    type: pn.type === "trigger" ? "triggerNode" : "blockNode",
    position: pn.position,
    data: { node: pn },
    selected: false,
  }
}

function toRFEdge(pe: PipelineEdge): Edge {
  return {
    id: pe.id,
    source: pe.source,
    target: pe.target,
    type: "smoothstep",
    style: { stroke: "#D1D5DB", strokeWidth: 2 },
    markerEnd: { type: "arrowclosed" as const, color: "#D1D5DB" },
  }
}

function fromRFNode(rfNode: Node): PipelineNode {
  const existing = (rfNode.data as { node: PipelineNode }).node
  return { ...existing, position: rfNode.position }
}

// ── Unique ID generator ───────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID()
}

// ── PipelineCanvas ────────────────────────────────────────────────────────────

interface Props {
  initialPipeline: Pipeline | null
  preset?: string
  customInit?: string | null
  customBuild?: string | null
  artifactPath?: string | null
  onSave: (pipeline: Pipeline) => Promise<void>
  fullscreen?: boolean
}

export default function PipelineCanvas({
  initialPipeline,
  preset = "node",
  customInit,
  customBuild,
  artifactPath,
  onSave,
  fullscreen = false,
}: Props) {
  const defaultPipeline = buildDefaultPipeline(preset, customInit, customBuild, artifactPath)
  const seed = initialPipeline ?? defaultPipeline

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(seed.nodes.map(toRFNode))
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(seed.edges.map(toRFEdge))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Keep track of nodes by id for the config panel
  const nodeMap = useMemo(
    () => Object.fromEntries(rfNodes.map((n) => [n.id, fromRFNode(n)])),
    [rfNodes],
  )
  const selectedNode = selectedNodeId ? nodeMap[selectedNodeId] : null

  // ── Sync pipeline nodes when initialPipeline changes ──────────────────────
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const p = initialPipeline ?? defaultPipeline
    setRfNodes(p.nodes.map(toRFNode))
    setRfEdges(p.edges.map(toRFEdge))
  }, [initialPipeline]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onConnect = useCallback(
    (connection: Connection) => {
      setRfEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: { stroke: "#D1D5DB", strokeWidth: 2 },
            markerEnd: { type: "arrowclosed" as const, color: "#D1D5DB" },
          },
          eds,
        ),
      )
    },
    [setRfEdges],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
      // Detect selection changes
      for (const c of changes) {
        if (c.type === "select") {
          setSelectedNodeId(c.selected ? c.id : null)
        }
      }
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  const handleAddBlock = useCallback(
    (type: string) => {
      const def = BLOCK_DEF_MAP[type as NodeType]
      if (!def) return
      const id = `n-${uid()}`
      const newNode: PipelineNode = {
        id,
        type: type as NodeType,
        label: def.label,
        config: { ...def.defaultConfig },
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      }
      setRfNodes((ns) => [...ns, toRFNode(newNode)])
    },
    [setRfNodes],
  )

  const handleNodeChange = useCallback(
    (id: string, patch: Partial<PipelineNode>) => {
      setRfNodes((ns) =>
        ns.map((n) => {
          if (n.id !== id) return n
          const current = fromRFNode(n)
          const updated = { ...current, ...patch }
          return { ...n, data: { node: updated } }
        }),
      )
    },
    [setRfNodes],
  )

  const handleDeleteNode = useCallback(
    (id: string) => {
      setRfNodes((ns) => ns.filter((n) => n.id !== id))
      setRfEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodeId(null)
    },
    [setRfNodes, setRfEdges],
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const pipeline: Pipeline = {
        version: 1,
        nodes: rfNodes.map(fromRFNode),
        edges: rfEdges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      }
      await onSave(pipeline)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [rfNodes, rfEdges, onSave])

  return (
    <div className={`flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${fullscreen ? "h-full" : "h-[640px]"}`}>
      {/* Left: Block palette */}
      <BlockPalette onAddBlock={handleAddBlock} />

      {/* Center: Canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={NODE_TYPES}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode="Delete"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
          <Controls className="!border-gray-200 !bg-white !shadow-sm" />
          <MiniMap
            nodeColor={(n) => {
              const pn = (n.data as { node: PipelineNode })?.node
              if (!pn) return "#E5E7EB"
              const def = BLOCK_DEF_MAP[pn.type]
              if (!def) return "#E5E7EB"
              const colorMap: Record<string, string> = {
                git: "#60A5FA", bun: "#FB923C", npm: "#F87171",
                yarn: "#22D3EE", go: "#38BDF8", shell: "#9CA3AF", artifact: "#34D399",
              }
              return colorMap[def.category] ?? "#E5E7EB"
            }}
            maskColor="rgba(255,255,255,0.7)"
            className="!border-gray-200"
          />
          <Panel position="top-right">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
                }`}
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save Pipeline"}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right: Config panel */}
      {selectedNode && selectedNode.type !== "trigger" && (
        <NodeConfigPanel
          node={selectedNode}
          onChange={handleNodeChange}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}
