import WorkersList from "@/components/WorkersList"

export default function WorkersPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workers</h1>
        <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">
          Run <code className="font-mono">./bobby</code> on your machine to register a new worker
        </div>
      </div>
      <WorkersList />
    </div>
  )
}
