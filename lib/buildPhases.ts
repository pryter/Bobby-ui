export const PHASE_START_RE = /^##\[phase-start:([\w-]+):(.+)\]$/
export const PHASE_END_RE = /^##\[phase-end:(success|failure)\]$/

export interface BuildPhase {
  id: string
  label: string
  status: "pending" | "running" | "success" | "failure"
  logs: string[]
}

/** Parse a flat array of log lines (including phase marker lines) into BuildPhase sections. */
export function parseLogPhases(lines: string[]): BuildPhase[] {
  const phases: BuildPhase[] = []
  let currentIdx = -1

  for (const line of lines) {
    const startMatch = line.match(PHASE_START_RE)
    const endMatch = line.match(PHASE_END_RE)

    if (startMatch) {
      phases.push({ id: startMatch[1], label: startMatch[2], status: "running", logs: [] })
      currentIdx = phases.length - 1
    } else if (endMatch && currentIdx >= 0) {
      phases[currentIdx].status = endMatch[1] as "success" | "failure"
    } else if (currentIdx >= 0) {
      phases[currentIdx].logs.push(line)
    }
  }

  return phases
}
