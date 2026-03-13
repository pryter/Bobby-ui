// Pipeline serialization schema — must mirror service/pkg/comm/pipeline.go

export type NodeType =
  | "trigger"
  | "git-clone"
  | "shell"
  | "bun-install"
  | "bun-run"
  | "npm-install"
  | "npm-run"
  | "yarn-install"
  | "yarn-run"
  | "go-mod-download"
  | "go-build"
  | "pack-artifact"
  | "upload-artifact"

export interface PipelineNode {
  id: string
  type: NodeType
  label: string
  config: Record<string, string>
  position: { x: number; y: number }
}

export interface PipelineEdge {
  id: string
  source: string
  target: string
}

export interface Pipeline {
  version: 1
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

// ── Block definitions ─────────────────────────────────────────────────────────

export type BlockCategory = "git" | "bun" | "npm" | "yarn" | "go" | "shell" | "artifact"

export interface BlockDef {
  type: NodeType
  label: string
  description: string
  category: BlockCategory
  /** Default config values shown in the config panel */
  defaultConfig: Record<string, string>
  /** Config field specs for the config panel */
  configFields: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  placeholder?: string
  required?: boolean
}

export const BLOCK_DEFS: BlockDef[] = [
  // Git
  {
    type: "git-clone",
    label: "Git Clone",
    description: "Clone or pull the repository",
    category: "git",
    defaultConfig: {},
    configFields: [],
  },
  // Shell
  {
    type: "shell",
    label: "Shell Command",
    description: "Run a custom shell command",
    category: "shell",
    defaultConfig: { command: "" },
    configFields: [{ key: "command", label: "Command", placeholder: "e.g. make build", required: true }],
  },
  // Bun
  {
    type: "bun-install",
    label: "Bun Install",
    description: "bun install",
    category: "bun",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "bun-run",
    label: "Bun Run",
    description: "bun run <script>",
    category: "bun",
    defaultConfig: { script: "build" },
    configFields: [{ key: "script", label: "Script", placeholder: "build", required: true }],
  },
  // npm
  {
    type: "npm-install",
    label: "npm Install",
    description: "npm install",
    category: "npm",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "npm-run",
    label: "npm Run",
    description: "npm run <script>",
    category: "npm",
    defaultConfig: { script: "build" },
    configFields: [{ key: "script", label: "Script", placeholder: "build", required: true }],
  },
  // Yarn
  {
    type: "yarn-install",
    label: "Yarn Install",
    description: "yarn",
    category: "yarn",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "yarn-run",
    label: "Yarn Run",
    description: "yarn <script>",
    category: "yarn",
    defaultConfig: { script: "build" },
    configFields: [{ key: "script", label: "Script", placeholder: "build", required: true }],
  },
  // Go
  {
    type: "go-mod-download",
    label: "Go Mod Download",
    description: "go mod download",
    category: "go",
    defaultConfig: {},
    configFields: [],
  },
  {
    type: "go-build",
    label: "Go Build",
    description: "go build",
    category: "go",
    defaultConfig: { args: "./..." },
    configFields: [{ key: "args", label: "Build args", placeholder: "./..." }],
  },
  // Artifact
  {
    type: "pack-artifact",
    label: "Pack Artifact",
    description: "Zip a directory for upload",
    category: "artifact",
    defaultConfig: { path: "" },
    configFields: [{ key: "path", label: "Source folder", placeholder: "e.g. dist, .next" }],
  },
  {
    type: "upload-artifact",
    label: "Upload Artifact",
    description: "Upload packed artifact to Bobby",
    category: "artifact",
    defaultConfig: {},
    configFields: [],
  },
]

export const BLOCK_DEF_MAP: Record<NodeType, BlockDef> = Object.fromEntries(
  BLOCK_DEFS.map((d) => [d.type, d])
) as Record<NodeType, BlockDef>

// ── Category styles ───────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<BlockCategory, { border: string; bg: string; text: string; dot: string }> = {
  git:      { border: "border-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
  bun:      { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  npm:      { border: "border-red-400",    bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400" },
  yarn:     { border: "border-cyan-400",   bg: "bg-cyan-50",   text: "text-cyan-700",   dot: "bg-cyan-400" },
  go:       { border: "border-sky-400",    bg: "bg-sky-50",    text: "text-sky-700",    dot: "bg-sky-400" },
  shell:    { border: "border-gray-400",   bg: "bg-gray-50",   text: "text-gray-700",   dot: "bg-gray-400" },
  artifact: { border: "border-green-400",  bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
}

// ── Default pipelines per preset ─────────────────────────────────────────────

function makeNode(
  id: string,
  type: NodeType,
  label: string,
  config: Record<string, string>,
  x: number,
  y: number,
): PipelineNode {
  return { id, type, label, config, position: { x, y } }
}

function makeEdge(id: string, source: string, target: string): PipelineEdge {
  return { id, source, target }
}

const CX = 320
const STEP = 140

export function buildDefaultPipeline(
  preset: string,
  customInit?: string | null,
  customBuild?: string | null,
  artifactPath?: string | null,
): Pipeline {
  const nodes: PipelineNode[] = []
  const edges: PipelineEdge[] = []

  // Trigger node
  nodes.push(makeNode("n-trigger", "trigger", "Git Push", {}, CX, 60))

  // Clone
  nodes.push(makeNode("n-clone", "git-clone", "Clone Repository", {}, CX, 60 + STEP))
  edges.push(makeEdge("e-trigger-clone", "n-trigger", "n-clone"))

  let prev = "n-clone"
  let y = 60 + STEP * 2

  if (preset === "node") {
    nodes.push(makeNode("n-install", "yarn-install", "Install Dependencies", {}, CX, y))
    edges.push(makeEdge("e-clone-install", prev, "n-install"))
    prev = "n-install"
    y += STEP

    nodes.push(makeNode("n-build", "yarn-run", "Build", { script: "build" }, CX, y))
    edges.push(makeEdge("e-install-build", prev, "n-build"))
    prev = "n-build"
    y += STEP
  } else if (preset === "go") {
    nodes.push(makeNode("n-install", "go-mod-download", "Download Dependencies", {}, CX, y))
    edges.push(makeEdge("e-clone-install", prev, "n-install"))
    prev = "n-install"
    y += STEP

    nodes.push(makeNode("n-build", "go-build", "Build", { args: "./..." }, CX, y))
    edges.push(makeEdge("e-install-build", prev, "n-build"))
    prev = "n-build"
    y += STEP
  } else if (preset === "custom") {
    if (customInit) {
      nodes.push(makeNode("n-install", "shell", "Init", { command: customInit }, CX, y))
      edges.push(makeEdge("e-clone-install", prev, "n-install"))
      prev = "n-install"
      y += STEP
    }
    if (customBuild) {
      nodes.push(makeNode("n-build", "shell", "Build", { command: customBuild }, CX, y))
      edges.push(makeEdge("e-install-build", prev, "n-build"))
      prev = "n-build"
      y += STEP
    }
  }

  nodes.push(makeNode("n-pack", "pack-artifact", "Pack Artifact", { path: artifactPath ?? "" }, CX, y))
  edges.push(makeEdge("e-build-pack", prev, "n-pack"))
  y += STEP

  nodes.push(makeNode("n-upload", "upload-artifact", "Upload Artifact", {}, CX, y))
  edges.push(makeEdge("e-pack-upload", "n-pack", "n-upload"))

  return { version: 1, nodes, edges }
}
