import { Link, useOutletContext } from "@remix-run/react"
import type { Dispatch } from "react"

import { useSupabase } from "@/root"

export default function AccountSignin() {
  const { setLoading } = useOutletContext<{ setLoading: Dispatch<boolean> }>()
  const supabase = useSupabase()

  const handleGitHubLogin = async () => {
    const url = new URL(window.location.href)
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: url.toString().replace(url.pathname, "/auth/callback")
      }
    })
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const url = new URL(window.location.href)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: url.toString().replace(url.pathname, "/auth/callback")
      }
    })
  }

  return (
    <div className="flex h-full w-full flex-col items-center px-8 pb-6 pt-8">
      <h1 className="text-center text-3xl font-bold tracking-wide">Sign-in</h1>
      <p className="mb-2 mt-1 text-center font-light leading-[18px] tracking-wide text-gray-800">
        Sign-in email and password or other options below.
      </p>
      <div className="flex space-x-2">
        <button
          onClick={handleGoogleLogin}
          className="my-4 flex h-10 w-20 items-center justify-center rounded-lg bg-gray-900 font-medium text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        </button>
        <button
          onClick={handleGitHubLogin}
          className="my-4 flex h-10 w-20 items-center justify-center rounded-lg bg-gray-900 font-medium text-white"
        >
          <svg
            width="24"
            viewBox="0 0 98 96"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill="#fff"
            />
          </svg>
        </button>
      </div>
      <div className="mb-6">
        <input
          placeholder="Email"
          className="h-10 w-full rounded-lg border border-gray-900 bg-gray-100 px-4"
        />
        <input
          type={"password"}
          placeholder="password"
          className="mt-4 h-10 w-full rounded-lg border border-gray-900 bg-gray-100 px-4"
        />
      </div>
      <button className="mt-4 w-full rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm">
        Sign-in
      </button>
      <Link
        to={"forgot"}
        className="mb-2 mt-2.5 text-xs font-medium tracking-wide"
      >
        Forgot password?
      </Link>
    </div>
  )
}
