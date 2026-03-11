import { createClient } from "@/lib/supabase/server"
import { getWorker, getBuilds } from "@/lib/api"
import Link from "next/link"

function StatusBadge({ status, conclusion }: { status: string; conclusion: string | null }) {
  const label = conclusion || status
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    failure: "bg-red-100 text-red-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-gray-100 text-gray-600",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[label] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  )
}

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [worker, builds] = await Promise.all([
    getWorker(id, session!.access_token).catch(() => null),
    getBuilds(id, session!.access_token).catch(() => []),
  ])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
      <Link href="/dashboard/workers" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to workers
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <h1 className="text-2xl font-semibold">{worker?.name || id}</h1>
        {worker && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${worker.online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
            {worker.online ? "Online" : "Offline"}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-sm text-gray-400">{id}</p>

      <h2 className="mt-8 text-lg font-semibold">Recent Builds</h2>
      <div className="mt-4 space-y-3">
        {builds.length === 0 && (
          <p className="text-sm text-gray-500">No builds yet.</p>
        )}
        {builds.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md">
            <div>
              <h3 className="font-medium">{b.repoName || `repo #${b.repoId}`}</h3>
              <p className="mt-0.5 font-mono text-xs text-gray-400">
                {b.headSha?.slice(0, 7)} · {new Date(b.startedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={b.status} conclusion={b.conclusion} />
              {b.artifactUrl && (
                <a
                  href={b.artifactUrl}
                  className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                  download
                >
                  Download artifact
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
