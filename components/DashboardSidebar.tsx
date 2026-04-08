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
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import classnames from "classnames"
import { type FC, type ForwardRefExoticComponent, type SVGProps } from "react"
import { createClient } from "@/lib/supabase/client"
import { TierBadge } from "@/components/Badge/TierBadge"
import { useAuth } from "@/components/AuthProvider"
import { useTheme } from "@/lib/useTheme"

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1]

// ── Bobby logo mark (shared with landing + login) ──────────────────────────

const BobbyMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"
    />
  </svg>
)

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
        "relative mt-1 flex w-full cursor-pointer items-center rounded-full transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-4 px-4 py-2",
        isHighlighted
          ? "text-white dark:text-gray-900"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {isHighlighted && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-full bg-gray-900 shadow-lg shadow-black/10
                     dark:bg-white dark:shadow-black/40"
          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
        />
      )}
      <Icon
        stroke="currentColor"
        strokeWidth={2.3}
        className="relative z-10 h-5 w-5 shrink-0"
      />
      <motion.h2
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
        transition={{ duration: 0.15, ease: EASE }}
        className="relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium"
      >
        {title}
      </motion.h2>
    </div>
  )

  if (disabled) return inner
  return <Link href={href}>{inner}</Link>
}

// ── Theme toggle ────────────────────────────────────────────────────────────

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { dark, toggle } = useTheme()

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors
                   border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900
                   dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        {dark ? (
          <SunIcon className="h-4 w-4" strokeWidth={2.3} />
        ) : (
          <MoonIcon className="h-4 w-4" strokeWidth={2.3} />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative mt-4 flex h-9 w-full items-center rounded-full border p-1 transition-colors
                 border-gray-200/80 bg-white
                 dark:border-white/[0.08] dark:bg-white/[0.04]"
    >
      {/* Sliding thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
        className={classnames(
          "absolute top-1 h-7 w-[calc(50%-0.25rem)] rounded-full shadow-sm",
          "bg-gray-900 dark:bg-white",
          dark ? "left-[calc(50%+0rem)]" : "left-1",
        )}
      />

      {/* Light option */}
      <span
        className={classnames(
          "relative z-10 flex h-7 flex-1 items-center justify-center gap-1.5 text-xs font-semibold transition-colors",
          !dark ? "text-white" : "text-gray-500 dark:text-gray-400",
        )}
      >
        <SunIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        Light
      </span>

      {/* Dark option */}
      <span
        className={classnames(
          "relative z-10 flex h-7 flex-1 items-center justify-center gap-1.5 text-xs font-semibold transition-colors",
          dark ? "text-gray-900" : "text-gray-500 dark:text-gray-400",
        )}
      >
        <MoonIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        Dark
      </span>
    </button>
  )
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
    <div className="flex h-full min-h-screen w-[220px] flex-col border-r py-5 px-3
                    border-gray-200/80 bg-[#FCFCFC]
                    dark:border-white/[0.08] dark:bg-white/[0.02] dark:backdrop-blur-xl">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em]
                    text-indigo-500 dark:text-indigo-400">
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
                  "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "font-semibold text-white dark:text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="project-sidebar-active-pill"
                    className="absolute inset-0 rounded-xl bg-gray-900 dark:bg-white"
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span className="relative z-10">{label}</span>
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
        className="relative flex min-h-screen flex-shrink-0 flex-col overflow-hidden border-r
                   border-gray-200/80 bg-white
                   dark:border-white/[0.08] dark:bg-white/[0.02] dark:backdrop-blur-xl"
      >
        {/* Subtle indigo glow in dark mode — mirrors landing hero */}
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse at top left,rgba(99,102,241,0.10) 0%,transparent 55%)",
          }}
        />

        <div
          className={classnames(
            "relative z-10 flex h-full flex-col justify-between transition-[padding]",
            collapsed ? "px-3 py-5" : "px-6 py-6",
          )}
          style={{ transitionDuration: "300ms", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
        >
          {/* Top */}
          <div>
            {/* Logo */}
            <div className={classnames("flex items-center", collapsed ? "justify-center" : "gap-2")}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                              bg-gray-900 dark:bg-white">
                <BobbyMark className="h-5 w-5 text-white dark:text-gray-900" />
              </div>
              <motion.div
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <span className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  Bobby
                </span>
                <TierBadge variant="pro" />
              </motion.div>
            </div>

            {/* Nav items */}
            <div className={classnames("mt-8", collapsed && "flex flex-col items-center")}>
              <MenuItem Icon={HomeIcon}      title="Home"     id=""        collapsed={collapsed} />
              <MenuItem Icon={FolderIcon}    title="Projects" id="project" collapsed={collapsed} />

              <motion.h2
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto", marginTop: collapsed ? 0 : "1.5rem" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="overflow-hidden px-4 text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap
                           text-indigo-500 dark:text-indigo-400"
              >
                Monitoring
              </motion.h2>
              <MenuItem Icon={CommandLineIcon} title="Log Manager" id="log"       collapsed={collapsed} disabled />
              <MenuItem Icon={ArchiveBoxIcon}  title="Artifacts"   id="artifacts" collapsed={collapsed} disabled />

              <motion.h2
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto", marginTop: collapsed ? 0 : "1.5rem" }}
                transition={{ duration: 0.15, ease: EASE }}
                className="overflow-hidden px-4 text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap
                           text-indigo-500 dark:text-indigo-400"
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

            <ThemeToggle collapsed={collapsed} />

            {/* User card / avatar */}
            {collapsed ? (
              <div
                style={{ backgroundImage: `url('${userData.avatarUrl}')`, backgroundSize: "cover" }}
                className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-white/[0.12]"
              />
            ) : (
              <div className="relative mt-4 flex flex-row justify-between overflow-clip rounded-2xl border
                              border-gray-200/80 bg-white
                              dark:border-white/[0.08] dark:bg-white/[0.04]">
                <div className="relative flex h-full flex-row items-center p-3 w-min overflow-hidden mr-10">
                  <div
                    style={{ backgroundImage: `url('${userData.avatarUrl}')`, backgroundSize: "cover" }}
                    className="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-white/[0.08]"
                  />
                  <div className="flex flex-col ml-3 items-start justify-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {userData.fullName}
                    </h3>
                    <h4 className="text-xs text-gray-500 dark:text-gray-400">
                      {userData.email}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex cursor-pointer absolute right-0 top-0 shrink-0 h-full items-center border-l px-2 transition-colors
                             border-gray-200/80 text-gray-500 hover:bg-gray-50 hover:text-gray-900
                             dark:border-white/[0.08] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Sign out"
                >
                  <ArrowRightOnRectangleIcon stroke="currentColor" strokeWidth={2.5} className="h-3 w-3" />
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
