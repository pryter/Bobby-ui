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
  name: string
  online: boolean
  createdAt: string
}

export interface Build {
  id: string
  setupId: string
  repoId: number
  repoName: string
  headSha: string
  status: string
  conclusion: string | null
  artifactUrl: string | null
  checkRunUrl: string | null
  startedAt: string
  finishedAt: string | null
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

export function getBuild(setupId: string, buildId: string, token: string): Promise<Build> {
  return apiFetch(`/workers/${setupId}/builds/${buildId}`, token)
}

export function claimPairingCode(code: string, token: string) {
  return apiFetch(`/pair/${code}`, token, { method: "POST" })
}
