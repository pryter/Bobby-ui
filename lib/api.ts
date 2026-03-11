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
  repo: { repoId: number; repoName: string; repoFullName: string },
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

/** Returns the WebSocket URL for real-time events. */
export function getWorkerStreamURL(token: string): string {
  const base = SERVICE_URL.replace(/^http/, "ws")
  return `${base}/api/ws?token=${encodeURIComponent(token)}`
}
