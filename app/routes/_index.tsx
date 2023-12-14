import { useNavigate } from "@remix-run/react"

export default function Index() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-gray-900">
      <h1 className="text-2xl font-medium tracking-wide">Hi, I&apos;m Bobby</h1>
      <p className="mt-2 text-center font-light tracking-wide text-gray-600">
        Your personal project builder.
      </p>
      <button
        onClick={() => {
          navigate("/account")
        }}
        className="mt-6 rounded-lg bg-gray-900 px-8 py-2 text-sm font-medium tracking-wide text-white"
      >
        Get inside
      </button>
    </div>
  )
}
