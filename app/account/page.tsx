"use client"
import Link from "next/link"
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"
import { OAuthButton } from "@/components/Button/OAuthButton"
import { TextButton } from "@/components/Button/TextButton"
import { TextInput } from "@/components/Forms/TextInput"

type OAuthProvider = "github" | "google"

export default function AccountPage() {
  const [signingIn, setSigningIn] = useState<OAuthProvider | null>(null)

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (signingIn) return
    setSigningIn(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider
    })
    setTimeout(() => {
      setSigningIn(null)
    }, 20 * 1000)
  }

  useEffect(() => {
    console.log(signingIn)
  }, [signingIn]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-gray-800">
      <div className="relative flex w-full max-w-[360px] rounded-2xl border border-gray-900 bg-white">
        <div className="flex h-full w-full flex-col items-center px-8 pb-6 pt-8">
          <h1 className="text-center text-3xl font-bold tracking-wide">Sign-in</h1>
          <p className="mb-2 mt-1 text-center font-light leading-[18px] tracking-wide text-gray-800">
            {signingIn ? `Redirecting to ${signingIn}…` : "Sign-in with your preferred provider below."}
          </p>
          <div className="flex space-x-2">
            <OAuthButton
              onClick={() => {handleOAuthLogin("google")}}
              provider="google"
              loading={signingIn === "google"}
              disabled={signingIn !== null && signingIn !== "google"}
            />
            <OAuthButton
              onClick={() => {handleOAuthLogin("github")}}
              provider="github"
              loading={signingIn === "github"}
              disabled={signingIn !== null && signingIn !== "github"}
            />
          </div>
          <div className="mb-10 mt-2 w-full space-y-4">
            <TextInput placeholder="email" title="Email" type="email" />
            <TextInput placeholder="password" title="Password" type="password" />
          </div>
          <TextButton content={{ text: "Sign-in" }} onClick={() => {}} />
          <Link
            href="/account/forgot"
            className="mb-2 mt-2.5 text-xs font-medium tracking-wide"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  )
}
