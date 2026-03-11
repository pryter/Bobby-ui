export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="h-4 w-28 rounded bg-gray-200" />
      <div className="mt-4 h-7 w-64 rounded bg-gray-200" />
      <div className="mt-1 h-4 w-40 rounded bg-gray-200" />
      <div className="mt-8 h-40 rounded-2xl bg-gray-100" />
      <div className="mt-8 h-6 w-32 rounded bg-gray-200" />
      <div className="mt-3 h-24 rounded-2xl bg-gray-100" />
    </div>
  )
}
