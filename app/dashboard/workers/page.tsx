import { getServerSession } from "@/lib/auth"
import { getWorkers } from "@/lib/api"
import WorkersList from "@/components/WorkersList"

export default async function WorkersPage() {
  const session = await getServerSession()

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

      <WorkersList workers={workers} token={session!.access_token} />
    </div>
  )
}
