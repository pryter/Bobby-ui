import { createClient } from "@/lib/supabase/server"
import { getWorkers } from "@/lib/api"
import Link from "next/link"

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  )
}

export default async function WorkersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let workers: Awaited<ReturnType<typeof getWorkers>> = []
  let error: string | null = null

  try {
    workers = await getWorkers(session!.access_token)
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workers</h1>
        <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">
          Run <code className="font-mono">./bobby</code> on your machine to register a new worker
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load workers: {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {workers.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-gray-300 px-8 py-12 text-center text-gray-500">
            <p className="font-medium">No workers registered yet.</p>
            <p className="mt-1 text-sm">Run Bobby on your on-premise machine and visit the pairing URL it prints.</p>
          </div>
        )}
        {workers.map((w) => (
          <Link key={w.setupId} href={`/dashboard/workers/${w.setupId}`}>
            <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md transition hover:shadow-lg">
              <div>
                <h2 className="font-semibold">{w.name || w.setupId}</h2>
                <p className="mt-0.5 font-mono text-xs text-gray-400">{w.setupId}</p>
              </div>
              <OnlineBadge online={w.online} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
