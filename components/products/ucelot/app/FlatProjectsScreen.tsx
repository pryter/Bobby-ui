"use client"

import {
    DEMO_ORGS,
    GroupsStrip,
    LAYOUT,
    OrgHeader,
    ProjectTile,
    ProjectsHeader,
    projectsForOrg,
} from "./parts"
import AppShell from "./AppShell"

// The complete Ucelot Projects screen at exactly 1200 × 760, composed from the
// parts with LAYOUT geometry — for visual QA against the real app. The three
// regions are absolutely placed (sidebar, topbar, panel) so each can be swapped
// for your own animated container; inside them the real flex/grid flow is kept.
//
// Paint order mirrors the app: bloom → sidebar → panel (its halo shadow falls on
// the sidebar) → topbar (z-30 in the app, so it sits above the halo).
//
// `collapsed` folds the sidebar to the 68px icon rail and transitions there the
// way the app does: the parts fold themselves; this container animates the rail
// width, the two list indents and the topbar/panel left + width
// (LAYOUT.sidebar.collapsed).
export default function FlatProjectsScreen({ collapsed = false }: { collapsed?: boolean }) {
    const { page, orgGrid } = LAYOUT
    return (
        <AppShell collapsed={collapsed}>
            <div className="flex w-full flex-col" style={{ padding: `${page.padY}px ${page.padX}px`, gap: page.sectionGap }}>
                <ProjectsHeader />
                <GroupsStrip />
                <div className="flex flex-col" style={{ gap: orgGrid.orgGap }}>
                    {DEMO_ORGS.map((org) => {
                        const projects = projectsForOrg(org.key)
                        return (
                            <section key={org.key}>
                                <OrgHeader org={org} count={projects.length} style={{ marginBottom: orgGrid.headerToTiles }} />
                                {org.open && (
                                    <ul
                                        className="m-0 grid list-none p-0"
                                        style={{ gap: orgGrid.tileGap, gridTemplateColumns: `repeat(auto-fill, minmax(${orgGrid.tileMinWidth}px, 1fr))` }}
                                    >
                                        {projects.map((p) => (
                                            <li key={p.id}>
                                                <ProjectTile project={p} org={org} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )
                    })}
                </div>
            </div>
        </AppShell>
    )
}
