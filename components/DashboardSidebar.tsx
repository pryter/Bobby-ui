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
  EyeIcon,
  WrenchScrewdriverIcon,
  PuzzlePieceIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import classnames from "classnames"
import { type FC, type ForwardRefExoticComponent, type SVGProps } from "react"
import { createClient } from "@/lib/supabase/client"
import { TierBadge } from "@/components/Badge/TierBadge"
import { useAuth } from "@/components/AuthProvider"

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1]

// ── Main sidebar MenuItem (text fades when collapsing) ──────────────────────

interface MenuItemProps {
  Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  title: string
  id: string
  disabled?: boolean
  collapsed?: boolean
}

const MenuItem: FC<MenuItemProps> = ({ Icon, title, id, disabled, collapsed }) => {
  const pathname = usePathname()
  const href = id === "" ? "/dashboard" : `/dashboard/${id}`
  const isHighlighted = id === "" ? pathname === "/dashboard" : pathname.startsWith(`/dashboard/${id}`)

  const inner = (
    <div
      className={classnames(
        "mt-2 flex w-full cursor-pointer items-center rounded-full transition-colors",
        collapsed ? "justify-center px-2 py-2" : "space-x-4 px-4 py-2",
        isHighlighted
          ? "bg-gray-900 text-white shadow-lg"
          : "hover:bg-gray-600 hover:bg-opacity-20",
      )}
    >
      <Icon stroke="currentColor" strokeWidth={2.3} className="h-6 w-6 shrink-0" />
      <motion.h2
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
        transition={{ duration: 0.15, ease: EASE }}
        className="overflow-hidden whitespace-nowrap font-medium"
      >
        {title}
      </motion.h2>
    </div>
  )

  if (disabled) return inner
  return <Link href={href}>{inner}</Link>
}

// ── Project sub-nav sidebar ─────────────────────────────────────────────────

const PROJECT_NAV = [
  { Icon: EyeIcon,                   label: "Overview",       segment: null,             exact: true },
  { Icon: WrenchScrewdriverIcon,     label: "Configuration",  segment: "configuration" },
  { Icon: ArchiveBoxIcon,            label: "Artifacts",      segment: "artifacts" },
  { Icon: PuzzlePieceIcon,           label: "Integrations",   segment: "integrations" },
  { Icon: AdjustmentsHorizontalIcon, label: "Settings",       segment: "settings" },
]

function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-screen w-[220px] flex-col border-r border-gray-100 bg-[#FCFCFC] py-5 px-3">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Project
      </p>
      <div className="space-y-0.5">
        {PROJECT_NAV.map(({ Icon, label, segment, exact }) => {
          const href = segment
            ? `/dashboard/project/${projectId}/${segment}`
            : `/dashboard/project/${projectId}`
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/")

          return (
            <Link key={href} href={href}>
              <div
                className={classnames(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function DashboardSidebar() {
  const { user: userData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/account")
  }

  const projectMatch = pathname.match(/^\/dashboard\/project\/([^/]+)/)
  const projectId = projectMatch?.[1] ?? null
  const collapsed = !!projectId

  return (
    <div className="flex min-h-screen">
      {/* ── Main sidebar — animates between full and icon-rail ── */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 68 : 280 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative flex min-h-screen flex-shrink-0 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-400"
      >
        <div className="absolute inset-0 bg-white/90" />

        <div
          className={classnames(
            "relative z-10 flex h-full flex-col justify-between transition-[padding]",
            collapsed ? "px-3 py-5" : "px-8 py-6",
          )}
          style={{ transitionDuration: "300ms", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
        >
          {/* Top */}
          <div>
            {/* Logo */}
            <div className={classnames("flex items-center", collapsed ? "justify-center" : "gap-2")}>
              <motion.h1
                initial={false}
                animate={{ fontSize: collapsed ? "1rem" : "1.25rem" }}
                transition={{ duration: 0.3, ease: EASE }}
                className="font-bold text-gray-800 whitespace-nowrap"
              >
                {collapsed ? "B" : "Bobby"}
              </motion.h1>
              <motion.div
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="overflow-hidden"
              >
                <TierBadge variant="pro" />
              </motion.div>
            </div>

            {/* Nav items */}
            <div className={classnames("mt-6", collapsed && "flex flex-col items-center")}>
              <MenuItem Icon={HomeIcon}      title="Home"     id=""        collapsed={collapsed} />
              <MenuItem Icon={FolderIcon}    title="Projects" id="project" collapsed={collapsed} />

              <motion.h2
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto", marginTop: collapsed ? 0 : "1.5rem" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="overflow-hidden text-sm font-medium text-gray-500 whitespace-nowrap"
              >
                Monitoring
              </motion.h2>
              <MenuItem Icon={CommandLineIcon} title="Log Manager" id="log"       collapsed={collapsed} disabled />
              <MenuItem Icon={ArchiveBoxIcon}  title="Artifacts"   id="artifacts" collapsed={collapsed} disabled />

              <motion.h2
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto", marginTop: collapsed ? 0 : "1.5rem" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="overflow-hidden text-sm font-medium text-gray-500 whitespace-nowrap"
              >
                Build settings
              </motion.h2>
              <MenuItem Icon={KeyIcon}         title="Secrets" id="secrets" collapsed={collapsed} disabled />
              <MenuItem Icon={ServerStackIcon} title="Workers" id="workers" collapsed={collapsed} />
            </div>
          </div>

          {/* Bottom */}
          <div className={classnames(collapsed && "flex flex-col items-center gap-3")}>
            {!collapsed && (
              <>
                <MenuItem Icon={DocumentTextIcon} title="Account"     id="account" disabled />
                <MenuItem Icon={Cog6ToothIcon}    title="Preferences" id="setting" disabled />
              </>
            )}

            {/* User card / avatar */}
            {collapsed ? (
              <div
                style={{ backgroundImage: `url('${userData.avatarUrl}')`, backgroundSize: "cover" }}
                className="h-8 w-8 rounded-full bg-gray-200"
              />
            ) : (
              <div className="relative mt-4 flex flex-row rounded-xl bg-gray-900 pl-4 text-white">
                <div className="flex h-full flex-row items-center py-3">
                  <div
                    style={{ backgroundImage: `url('${userData.avatarUrl}')`, backgroundSize: "contain" }}
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
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Project sub-navigation — slides in to the right of the rail ── */}
      <AnimatePresence initial={false}>
        {projectId && (
          <motion.div
            key="project-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex-shrink-0 overflow-hidden"
          >
            <ProjectSidebar projectId={projectId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
