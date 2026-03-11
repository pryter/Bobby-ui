import { createClient } from "@/lib/supabase/server"
import { getRepo, getRepoBuilds, getWorkers } from "@/lib/api"
import ProjectDetail from "@/components/ProjectDetail"
import Link from "next/link"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const [project, builds, workers] = await Promise.all([
    getRepo(id, session.access_token).catch(() => null),
    getRepoBuilds(id, session.access_token).catch(() => []),
    getWorkers(session.access_token).catch(() => []),
  ])

  if (!project) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
        <Link href="/dashboard/project" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to projects
        </Link>
        <p className="mt-8 text-gray-500">Project not found.</p>
      </div>
    )
  }

  return (
    <ProjectDetail
      project={project}
      builds={builds}
      workers={workers}
      token={session.access_token}
    />
  )
}
