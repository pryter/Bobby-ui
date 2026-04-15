"use client"

import Navbar from "@/components/Navbar"
import { useTheme } from "@/lib/useTheme"

export default function DocsNavbar() {
  const { dark, toggle } = useTheme()
  return <Navbar dark={dark} onToggle={toggle} />
}
