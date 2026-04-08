const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_URL || "http://localhost:4244"

// Separate WebSocket URL — allows the WS server to live on a different host/port
// (e.g. a dedicated ws:// server or a load balancer with sticky sessions).
// Falls back to deriving from SERVICE_URL for zero-config local development.
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  SERVICE_URL.replace(/^http/, "ws")

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${SERVICE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface Worker {
  setupId: string
  name: string | null
  online: boolean
  createdAt: string
}

export interface Build {
  id: string
  setup_id: string
  repo_id: number
  repo_name: string
  head_sha: string
  status: string
  conclusion: string | null
  artifact_url: string | null
  check_run_url: string | null
  started_at: string
  finished_at: string | null
}

export interface MonitoredRepo {
  id: string
  user_id: string
  setup_id: string
  repo_id: number
  repo_name: string
  repo_full_name: string
  preset: string
  custom_init: string | null
  custom_build: string | null
  artifact_path: string | null
  created_at: string
}

export function getWorkers(token: string): Promise<Worker[]> {
  return apiFetch("/workers", token)
}

export function getWorker(setupId: string, token: string): Promise<Worker> {
  return apiFetch(`/workers/${setupId}`, token)
}

export function getBuilds(setupId: string, token: string): Promise<Build[]> {
  return apiFetch(`/workers/${setupId}/builds`, token)
}

export function claimPairingCode(code: string, token: string) {
  return apiFetch(`/pair/${code}`, token, { method: "POST" })
}

export function updateWorkerName(setupId: string, name: string, token: string): Promise<void> {
  return apiFetch(`/workers/${setupId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
}

export function getWorkerRepos(setupId: string, token: string): Promise<MonitoredRepo[]> {
  return apiFetch(`/workers/${setupId}/repos`, token)
}

export function addWorkerRepo(
  setupId: string,
  repo: {
    repoId: number
    repoName: string
    repoFullName: string
    preset?: string
    customInit?: string
    customBuild?: string
    artifactPath?: string
  },
  token: string
): Promise<void> {
  return apiFetch(`/workers/${setupId}/repos`, token, {
    method: "POST",
    body: JSON.stringify(repo),
  })
}

export function removeWorkerRepo(setupId: string, repoId: number, token: string): Promise<void> {
  return apiFetch(`/workers/${setupId}/repos/${repoId}`, token, { method: "DELETE" })
}

export function getAllRepos(token: string): Promise<MonitoredRepo[]> {
  return apiFetch("/repos", token)
}

export function getRepo(id: string, token: string): Promise<MonitoredRepo> {
  return apiFetch(`/repos/${id}`, token)
}

export function updateRepoPreset(
  id: string,
  config: { preset: string; customInit?: string; customBuild?: string; artifactPath?: string },
  token: string
): Promise<void> {
  return apiFetch(`/repos/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(config),
  })
}

export function getRepoBuilds(id: string, token: string): Promise<Build[]> {
  return apiFetch(`/repos/${id}/builds`, token)
}

/** Returns the WebSocket URL for real-time events. */
export function getWorkerStreamURL(token: string): string {
  return `${WS_URL}/api/ws?token=${encodeURIComponent(token)}`
}

const ARTIFACT_BASE_URL = "https://artifact-bobby.pryter.me"

/** Rewrites an artifact URL to use the public artifact CDN. */
export function getArtifactDownloadURL(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return ARTIFACT_BASE_URL + parsed.pathname
  } catch {
    return url
  }
}

/** One entry in a BuildSnapshot's event timeline.
 *  Note: the snapshot endpoint uses `"log"` (not `"build_log"`) as the log type. */
export interface BuildSnapshotEvent {
  seq: number
  ts: string
  type: "phase_start" | "phase_end" | "log"
  phaseId?: string
  label?: string
  status?: "success" | "failure"
  line?: string
}

/** Structured snapshot of a build timeline — the catch-up path used on first
 *  load and after any WS reconnect. For legacy (pre-rewrite) builds the service
 *  synthesizes this shape from the plain-text log, with `seq = 0`. */
export interface BuildSnapshot {
  buildId: string
  setupId: string
  repoId: number
  repoName: string
  headSha: string
  startedAt: string
  finishedAt?: string | null
  conclusion?: string | null
  lastSeq: number
  events: BuildSnapshotEvent[]
}

/** Fetches the structured snapshot for a build. Returns null on 404. */
export function getBuildSnapshot(
  buildId: string,
  token: string,
): Promise<BuildSnapshot | null> {
  return fetch(`${SERVICE_URL}/api/builds/${buildId}/snapshot`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => (res.ok ? (res.json() as Promise<BuildSnapshot>) : null))
}

/** Reassigns a monitored repo to a different worker. */
export function updateRepoWorker(repoId: string, setupId: string, token: string): Promise<void> {
  return apiFetch(`/repos/${repoId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ setupId }),
  })
}

/** Fetches the saved pipeline for a repo. Returns null when none is configured. */
export function getRepoPipeline(repoId: string, token: string): Promise<import("./pipeline").Pipeline | null> {
  return apiFetch(`/repos/${repoId}/pipeline`, token)
}

/** Saves (or clears) the pipeline for a repo. Pass null to fall back to preset. */
export function saveRepoPipeline(
  repoId: string,
  pipeline: import("./pipeline").Pipeline | null,
  token: string,
): Promise<void> {
  return apiFetch(`/repos/${repoId}/pipeline`, token, {
    method: "PUT",
    body: JSON.stringify(pipeline),
  })
}

/** Container environment config for a monitored repo. */
export interface ContainerConfig {
  /** OCI image, e.g. "node:20-alpine" or "golang:1.22". */
  image: string
  /** Extra environment variables injected into the container at runtime. */
  env?: Record<string, string>
}

/** Fetches the container config for a repo. Returns null when none is configured. */
export function getRepoContainer(repoId: string, token: string): Promise<ContainerConfig | null> {
  return apiFetch(`/repos/${repoId}/container`, token)
}

/** Triggers a rebuild of the last commit for the given repo.
 *  Pass reprovision=true to wipe the container and its volume first (clean environment). */
export function rebuildLast(repoId: string, reprovision: boolean, token: string): Promise<void> {
  return apiFetch(`/repos/${repoId}/rebuild`, token, {
    method: "POST",
    body: JSON.stringify({ reprovision }),
  })
}

/** Saves (or clears) the container config for a repo. Pass null to run builds on the host. */
export function saveRepoContainer(
  repoId: string,
  config: ContainerConfig | null,
  token: string,
): Promise<void> {
  return apiFetch(`/repos/${repoId}/container`, token, {
    method: "PUT",
    body: JSON.stringify(config),
  })
}
