import { use } from "react"
import ProjectConfiguration from "@/components/ProjectConfiguration"

export default function ConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ProjectConfiguration id={id} />
}
