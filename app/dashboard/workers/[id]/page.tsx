import { getServerSession } from "@/lib/auth"
import { getWorker, getBuilds } from "@/lib/api"
import WorkerDetail from "@/components/WorkerDetail"
import Link from "next/link"

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession()

  if (!session) return null

  const [worker, builds] = await Promise.all([
    getWorker(id, session.access_token).catch(() => null),
    getBuilds(id, session.access_token).catch(() => []),
  ])

  if (!worker) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
        <Link href="/dashboard/workers" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to workers
        </Link>
        <p className="mt-8 text-gray-500">Worker not found.</p>
      </div>
    )
  }

  return (
    <WorkerDetail
      worker={worker}
      builds={builds}
      token={session.access_token}
    />
  )
}
