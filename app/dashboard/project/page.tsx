import { getServerAuth } from "@/lib/auth"
import { getAllRepos, getWorkers } from "@/lib/api"
import ProjectsPage from "@/components/ProjectsPage"

export default async function ProjectPage() {
  const auth = await getServerAuth()

  if (!auth) return null

  const [projects, workers] = await Promise.all([
    getAllRepos(auth.token).catch(() => []),
    getWorkers(auth.token).catch(() => []),
  ])

  // provider_token (GitHub OAuth token) is not in the JWT — only available right after
  // GitHub OAuth login in the browser session. Handled client-side in ProjectsPage.
  return (
    <ProjectsPage
      initialProjects={projects}
      workers={workers}
      token={auth.token}
      initialGithubToken={null}
    />
  )
}
