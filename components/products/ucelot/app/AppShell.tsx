"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import {
    DEMO_ACCESS_GROUPS,
    DEMO_FEATURED,
    LAYOUT,
    PanelSurface,
    SIDEBAR_NAV,
    SidebarBalance,
    SidebarBloom,
    SidebarBrand,
    SidebarEmberScatter,
    SidebarGroupRow,
    SidebarNavItem,
    SidebarProjectRow,
    SidebarSectionHeader,
    SidebarSettings,
    SidebarTeamCaption,
    SidebarTeamSelector,
    SidebarUserCard,
    TopbarBell,
    TopbarCrumbs,
    TopbarSearch,
} from "./parts"

// The Ucelot app frame at exactly 1200 × 760 — sidebar, top bar and the
// floating panel — with whatever page you pass as `children` inside the panel
// (clipped to it, like the app's scroll container). `collapsed` gives the icon
// rail; `crumbs` the breadcrumb. Paint order mirrors the app: bloom → sidebar →
// panel (its halo shadow falls on the sidebar) → top bar.
export default function AppShell({
    collapsed = false, crumbs, children,
}: {
    collapsed?: boolean
    crumbs?: string[]
    children: ReactNode
}) {
    const { screen, sidebar: sb, topbar: tb, panel } = LAYOUT
    const fold = sb.collapsed
    const railW = collapsed ? fold.width : sb.width
    const shellX = collapsed ? fold.shell.x : panel.x
    const shellW = collapsed ? fold.shell.width : panel.width
    const listIndent = collapsed ? fold.body.listIndent : sb.body.listIndent

    return (
        <div className="ucelot-app relative overflow-hidden bg-[color:var(--c-shell)]" style={{ width: screen.width, height: screen.height }}>
            {/* ── Ember bloom ─────────────────────────────────────────────────
                position: fixed in the app, so the collapsed rail doesn't clip
                it. Under the sidebar, which therefore has no fill of its own
                (the root's shell colour shows through, same as the app). */}
            <SidebarBloom />

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside
                className="absolute overflow-hidden"
                style={{ left: sb.x, top: sb.y, width: railW, height: screen.height, transition: fold.transition.width }}
            >
                <SidebarEmberScatter />
                <div className="relative flex h-full flex-col" style={{ paddingTop: sb.padTop, paddingLeft: sb.padLeft }}>
                    <SidebarBrand collapsed={collapsed} />

                    <div style={{ padding: `${sb.team.padTop}px ${sb.team.padX}px ${sb.team.padBottom}px` }}>
                        <SidebarTeamCaption collapsed={collapsed} style={{ marginBottom: sb.team.captionGap }} />
                        <SidebarTeamSelector collapsed={collapsed} />
                        <SidebarBalance collapsed={collapsed} style={{ marginTop: sb.team.balanceGap }} />
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden" style={{ padding: `${sb.body.padTop}px ${sb.body.padX}px ${sb.body.padBottom}px` }}>
                        <div className="flex flex-col" style={{ gap: sb.body.navGap }}>
                            {SIDEBAR_NAV.map(({ key, label, Icon, active }) => (
                                <SidebarNavItem key={key} label={label} icon={<Icon />} active={active} collapsed={collapsed} />
                            ))}
                        </div>

                        <SidebarSectionHeader
                            label="Featured"
                            collapsed={collapsed}
                            style={{ marginTop: sb.body.sectionHeaderMarginTop, marginBottom: sb.body.sectionHeaderMarginBottom }}
                        />
                        {/* transition-[padding] duration-500 = fold.transition.listIndent */}
                        <motion.div
                            layout="position"
                            className="flex flex-col transition-[padding] duration-500"
                            style={{ marginTop: sb.body.listMarginTop, paddingLeft: listIndent, gap: sb.body.featuredGap }}
                        >
                            {DEMO_FEATURED.map((p) => (
                                <SidebarProjectRow key={p.id} project={p} collapsed={collapsed} />
                            ))}
                        </motion.div>

                        <SidebarSectionHeader
                            label="Groups"
                            collapsed={collapsed}
                            style={{ marginTop: sb.body.sectionHeaderMarginTop, marginBottom: sb.body.sectionHeaderMarginBottom }}
                        />
                        <motion.div
                            layout="position"
                            className="flex flex-col transition-[padding] duration-500"
                            style={{ marginTop: sb.body.listMarginTop, paddingLeft: listIndent, gap: sb.body.groupsGap }}
                        >
                            {DEMO_ACCESS_GROUPS.map((g) => (
                                <SidebarGroupRow key={g.id} name={g.name} collapsed={collapsed} />
                            ))}
                        </motion.div>
                    </div>

                    <div className="shrink-0" style={{ padding: `${sb.settings.padTop}px ${sb.settings.padX}px ${sb.settings.padBottom}px` }}>
                        <SidebarSettings collapsed={collapsed} />
                    </div>

                    <SidebarUserCard collapsed={collapsed} />
                </div>
            </aside>

            {/* ── Floating panel ──────────────────────────────────────────── */}
            <div className="absolute" style={{ left: shellX, top: panel.y, width: shellW, height: panel.height, transition: fold.shell.transition }}>
                <PanelSurface className="absolute inset-0" />
                <div className="absolute inset-0 overflow-hidden" style={{ borderTopLeftRadius: panel.radiusTopLeft }}>
                    {children}
                </div>
            </div>

            {/* ── Topbar ──────────────────────────────────────────────────── */}
            <header
                className="absolute flex items-center"
                style={{
                    left: shellX,
                    top: tb.y,
                    width: shellW,
                    height: tb.height,
                    paddingLeft: tb.padX,
                    paddingRight: tb.padX,
                    gap: tb.gap,
                    transition: fold.shell.transition,
                }}
            >
                <TopbarCrumbs crumbs={crumbs} />
                <div className="ml-auto flex shrink-0 items-center" style={{ gap: tb.actionsGap }}>
                    <TopbarSearch />
                    <TopbarBell />
                </div>
            </header>
        </div>
    )
}
