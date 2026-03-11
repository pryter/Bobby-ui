export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="h-9 w-56 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
