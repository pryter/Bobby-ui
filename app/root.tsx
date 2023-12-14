import { getClientSB } from "@client-lib/supabase"
import type { LinksFunction, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react"
import { loadEnv } from "@server-lib/loaders/loadEnv"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@typings/Database"
import { createContext, useContext, useState } from "react"

import style from "@/tailwind.css"

export const links: LinksFunction = () => [{ rel: "stylesheet", href: style }]

export const meta: MetaFunction = () => {
  return [{ title: "Bobby" }, { name: "Bobby official site" }]
}

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null)

export const loader = () => {
  return json(loadEnv())
}
export default function App() {
  const env = useLoaderData<typeof loader>()

  const [supabase] = useState(() => getClientSB(env))

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <SupabaseContext.Provider value={supabase}>
          <Outlet />
        </SupabaseContext.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export const useSupabase = (): SupabaseClient<Database> => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("Database Error")
  }

  return context
}
