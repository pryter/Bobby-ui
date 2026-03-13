"use client"

import {
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  KeyIcon,
  ServerStackIcon,
  ChevronLeftIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  PuzzlePieceIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import classnames from "classnames"
import { useMemo, type FC, type ForwardRefExoticComponent, type SVGProps } from "react"
import { createClient } from "@/lib/supabase/client"
import { TierBadge } from "@/components/Badge/TierBadge"
import { useAuth } from "@/components/AuthProvider"

// ── Full sidebar menu item ──────────────────────────────────────────────────

interface MenuItemProps {
  Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  title: string
  id: string
  disabled?: boolean
}

const MenuItem: FC<MenuItemProps> = ({ Icon, title, id, disabled }) => {
  const pathname = usePathname()
  const href = useMemo(() => (id === "" ? "/dashboard" : `/dashboard/${id}`), [id])
  const isHighlighted = useMemo(
    () => (id === "" ? pathname === "/dashboard" : pathname.startsWith(`/dashboard/${id}`)),
    [id, pathname],
  )

  if (disabled) {
    return (
      <motion.div
        className={classnames(
          "mt-2 flex w-full cursor-pointer items-center space-x-4 rounded-full px-4 py-2 transition-colors",
          isHighlighted ? "bg-gray-900 text-white shadow-lg" : "hover:bg-gray-600 hover:bg-opacity-20",
        )}
      >
        <Icon stroke="currentColor" strokeWidth={2.3} className="h-6 w-6 shrink-0" />
        <h2 className="h-[24px] overflow-hidden font-medium">{title}</h2>
      </motion.div>
    )
  }

  return (
    <Link href={href}>
      <motion.div
        className={classnames(
          "mt-2 flex w-full cursor-pointer items-center space-x-4 rounded-full px-4 py-2 transition-colors",
          isHighlighted ? "bg-gray-900 text-white shadow-lg" : "hover:bg-gray-600 hover:bg-opacity-20",
        )}
      >
        <Icon stroke="currentColor" strokeWidth={2.3} className="h-6 w-6 shrink-0" />
        <h2 className="h-[24px] overflow-hidden font-medium">{title}</h2>
      </motion.div>
    </Link>
  )
}

// ── Project icon-rail item ──────────────────────────────────────────────────

interface RailItemProps {
  Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  title: string
  href: string
  exact?: boolean
}

const RailItem: FC<RailItemProps> = ({ Icon, title, href, exact }) => {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <Link href={href} title={title}>
      <div
        className={classnames(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-600/20 hover:text-gray-800",
        )}
      >
        <Icon strokeWidth={2.2} className="h-5 w-5" />
      </div>
    </Link>
  )
}

// ── Root component ──────────────────────────────────────────────────────────

export default function DashboardSidebar() {
  const { user: userData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/account")
  }

  // Detect /dashboard/project/[id] and sub-routes
  const projectMatch = pathname.match(/^\/dashboard\/project\/([^/]+)/)
  const projectId = projectMatch?.[1] ?? null

  // ── Collapsed icon-rail (project detail mode) ──────────────────────────

  if (projectId) {
    return (
      <div className="relative flex min-h-screen w-[68px] flex-col items-center justify-between bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-400 py-5">
        <div className="absolute inset-0 bg-white/90" />

        <div className="relative z-10 flex flex-col items-center gap-1 w-full px-3">
          {/* Logo */}
          <span className="mb-3 text-sm font-bold text-gray-800">B</span>

          {/* Back to all projects */}
          <Link href="/dashboard/project" title="All Projects">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-600/20 hover:text-gray-700">
              <ChevronLeftIcon strokeWidth={2.5} className="h-4 w-4" />
            </div>
          </Link>

          <div className="my-2 w-8 border-t border-gray-200" />

          {/* Per-project nav */}
          <RailItem
            Icon={EyeIcon}
            title="Overview"
            href={`/dashboard/project/${projectId}`}
            exact
          />
          <RailItem
            Icon={WrenchScrewdriverIcon}
            title="Configuration"
            href={`/dashboard/project/${projectId}/configuration`}
          />
          <RailItem
            Icon={ArchiveBoxIcon}
            title="Artifacts"
            href={`/dashboard/project/${projectId}/artifacts`}
          />
          <RailItem
            Icon={PuzzlePieceIcon}
            title="Integrations"
            href={`/dashboard/project/${projectId}/integrations`}
          />
          <RailItem
            Icon={AdjustmentsHorizontalIcon}
            title="Settings"
            href={`/dashboard/project/${projectId}/settings`}
          />
        </div>

        {/* Avatar icon at bottom */}
        <div className="relative z-10">
          <div
            style={{ backgroundImage: `url('${userData.avatarUrl}')`, backgroundSize: "cover" }}
            className="h-9 w-9 rounded-full bg-gray-200"
          />
        </div>
      </div>
    )
  }

  // ── Full sidebar ────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ padding: "1.5rem 2rem" }}
      className="relative flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-400"
      style={{ padding: "1.5rem 2rem" }}
    >
      <div className="absolute left-0 top-0 z-[0] h-full w-full bg-white bg-opacity-90" />
      <div className="z-[1] flex flex-row items-center">
        <h1 className="relative text-xl font-bold text-gray-800">Bobby</h1>
        <TierBadge variant="pro" />
      </div>
      <div className="relative z-[1] mt-6 flex h-full w-[240px] grow flex-col justify-between">
        <div>
          <MenuItem Icon={HomeIcon} title="Home" id="" />
          <MenuItem Icon={FolderIcon} title="Projects" id="project" />
          <h2 className="mt-6 text-sm font-medium text-gray-500">Monitoring</h2>
          <MenuItem Icon={CommandLineIcon} title="Log Manager" id="log" disabled />
          <MenuItem Icon={ArchiveBoxIcon} title="Artifacts" id="artifacts" disabled />
          <h2 className="mt-6 text-sm font-medium text-gray-500">Build settings</h2>
          <MenuItem Icon={KeyIcon} title="Secrets" id="secrets" disabled />
          <MenuItem Icon={ServerStackIcon} title="Workers" id="workers" />
        </div>
        <div>
          <MenuItem Icon={DocumentTextIcon} title="Account" id="account" disabled />
          <MenuItem Icon={Cog6ToothIcon} title="Preferences" id="setting" disabled />
          <div className="relative mt-4 flex flex-row rounded-xl bg-gray-900 pl-4 text-white">
            <div className="flex h-full flex-row items-center py-3">
              <div
                style={{
                  backgroundImage: `url('${userData.avatarUrl}')`,
                  backgroundSize: "contain",
                }}
                className="h-10 w-10 shrink-0 rounded-full bg-white"
              />
              <div className="ml-2 w-[146px]">
                <h3 className="truncate text-sm font-medium">{userData.fullName}</h3>
                <h4 className="truncate text-xs text-gray-300">{userData.email}</h4>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-1 flex cursor-pointer items-center rounded-r-xl pl-1 pr-2 transition-colors hover:bg-white hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon stroke="currentColor" strokeWidth={2.8} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
