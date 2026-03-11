import { createClient } from "@/lib/supabase/server"
import { getAllRepos, getWorkers } from "@/lib/api"
import ProjectsPage from "@/components/ProjectsPage"

export default async function ProjectPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const [projects, workers] = await Promise.all([
    getAllRepos(session.access_token).catch(() => []),
    getWorkers(session.access_token).catch(() => []),
  ])

  // provider_token is the GitHub OAuth token — available right after GitHub OAuth login/link.
  // May be null if the user is in a persisted session (not a fresh OAuth).
  const githubToken = session.provider_token ?? null

  return (
    <ProjectsPage
      initialProjects={projects}
      workers={workers}
      token={session.access_token}
      initialGithubToken={githubToken}
    />
  )
}
