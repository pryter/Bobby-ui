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
            so there is zero flash of wrong background on any device/mode.       */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');var m=document.createElement('meta');m.name='theme-color';m.content=d?'#080808':'#ffffff';document.head.appendChild(m);}())` }} />
      </head>
      <body className={nunito.className}>{children}</body>
    </html>
  )
}
