const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_URL || "http://localhost:4244"

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
  const base = SERVICE_URL.replace(/^http/, "ws")
  return `${base}/api/ws?token=${encodeURIComponent(token)}`
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

/** Fetches the persisted build log text for a completed build. Returns empty string on 404. */
export function getBuildLog(buildId: string, token: string): Promise<string> {
  return fetch(`${SERVICE_URL}/api/builds/${buildId}/log`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => (res.ok ? res.text() : ""))
}

/** Reassigns a monitored repo to a different worker. */
export function updateRepoWorker(repoId: string, setupId: string, token: string): Promise<void> {
  return apiFetch(`/repos/${repoId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ setupId }),
  })
}
