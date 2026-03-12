"use client"

import { use } from "react"
import WorkerDetail from "@/components/WorkerDetail"

export default function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <WorkerDetail id={id} />
}
