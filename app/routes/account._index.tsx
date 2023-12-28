import { Link, useOutletContext } from "@remix-run/react"
import type { Dispatch } from "react"

import { useSupabase } from "@/root"
import { getCallbackURL } from "@/routes/auth.callback"
import {TextInput} from "@/components/Forms/TextInput";
import {OAuthButton} from "@/components/Button/OAuthButton";
import {TextButton} from "@/components/Button/TextButton";

export default function AccountSignin() {
  const { setLoading } = useOutletContext<{ setLoading: Dispatch<boolean> }>()
  const supabase = useSupabase()

  const handleGitHubLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getCallbackURL()
      }
    })
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getCallbackURL()
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
          <OAuthButton onClick={handleGoogleLogin} provider={"google"}/>
          <OAuthButton onClick={handleGitHubLogin} provider={"github"}/>
      </div>
      <div className="mt-2 mb-6 space-y-4 w-full">
        <TextInput placeholder={"email"} title={"Email"} type={"email"}/>
        <TextInput placeholder={"password"} title={"Password"} type={"password"}/>
      </div>
        <TextButton content={{text: "Sign-in"}} onClick={() => {}}/>
      <Link
        to={"forgot"}
        className="mb-2 mt-2.5 text-xs font-medium tracking-wide"
      >
        Forgot password?
      </Link>
    </div>
  )
}
