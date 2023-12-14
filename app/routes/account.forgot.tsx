import { Link } from "@remix-run/react"

export default function AccountForgot() {
  return (
    <div>
      <div className="flex h-full w-full flex-col items-center px-8 pb-6 pt-8">
        <h1 className="text-center text-3xl font-bold tracking-wide">
          Recover
        </h1>
        <p className="mb-2 mt-1 text-center font-light leading-[18px] tracking-wide text-gray-800">
          Sign-in email and password or other options below.
        </p>
        <input
          type={"email"}
          placeholder="Email"
          className="mt-4 h-10 w-full rounded-lg border border-gray-900 bg-gray-100 px-4"
        />
        <button className="mt-4 w-full rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm">
          Submit
        </button>
        <Link
          to={"/account"}
          className="mb-2 mt-2.5 text-xs font-medium tracking-wide"
        >
          back to sign-in
        </Link>
      </div>
    </div>
  )
}
