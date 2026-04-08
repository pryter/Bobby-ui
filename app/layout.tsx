import type { Metadata } from "next"
import "./globals.css"
import {Nunito} from "next/font/google"

export const metadata: Metadata = {
  title: "Bobby",
  description: "Your personal project builder",
}


const nunito = Nunito({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint — sets dark class + theme-color
            so there is zero flash of wrong background on any device/mode.
            Source of truth: localStorage "bobby-theme", else prefers-color-scheme.
            Must stay in sync with lib/useTheme.ts.                              */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('bobby-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');var m=document.createElement('meta');m.name='theme-color';m.content=d?'#080808':'#ffffff';document.head.appendChild(m);}catch(e){}}())` }} />
      </head>
      <body className={nunito.className}>{children}</body>
    </html>
  )
}
