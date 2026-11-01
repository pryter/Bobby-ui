"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { motion } from "framer-motion"
import "./ucelot-app.css"

// ─── Ucelot Projects screen — static, pixel-faithful parts ────────────────────
// Ported from bobby-tracker (Tailwind v4) to this repo's Tailwind v3:
//   components/layout/app-shell.tsx · sidebar.tsx · team-selector.tsx ·
//   balance-pill.tsx · notification-popover.tsx (closed bell) ·
//   components/ui/pixel-scatter.tsx · field-card.tsx ·
//   app/(app)/projects/page.tsx · components/projects/project-org-grid.tsx ·
//   project-tile.tsx · project-glyph.tsx · new-project-button.tsx ·
//   components/groups/new-group-button.tsx
//
// Every part renders correctly on its own inside a `.ucelot-app` ancestor given
// only a width. External margins/paddings that the real shell applies BETWEEN
// parts were moved out into LAYOUT, so containers can be rebuilt freely.
// Links/buttons are plain div/span: no router, no data, no hover states, no
// mount animations — those are yours to add.
//
// Sidebar parts take `collapsed` (default false) and TRANSITION into the app's
// 68px icon rail themselves (sidebar.tsx `mode="rail"`), with the app's own CSS
// transitions. What the containers must animate is in LAYOUT.sidebar.collapsed.

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

type PartProps = { className?: string; style?: CSSProperties }

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT — exact geometry of the real shell at 1200 × 760 (md+ breakpoint)
// ════════════════════════════════════════════════════════════════════════════

/** Collapsed sidebar width (sidebar.tsx RAIL_W): the icon rail. */
export const RAIL_W = 68

/** Tailwind's default transition easing — what every CSS transition in the
 *  app's sidebar runs on (v4 --default-transition-timing-function). */
export const SIDEBAR_EASE = "cubic-bezier(0.4, 0, 0.2, 1)"

export const LAYOUT = {
    screen: { width: 1200, height: 760 },

    sidebar: {
        x: 0,
        y: 0,
        width: 256, // aside w-64; content column = 256 − padLeft
        padTop: 8, // nav pt-2
        padLeft: 8, // nav pl-2 (no right padding)
        contentWidth: 248,
        brand: { height: 56, padX: 12, markSize: 32, labelGap: 10 },
        team: {
            padTop: 6, // pt-1.5
            padX: 10, // px-2.5 → inner width 228
            padBottom: 4, // pb-1
            innerWidth: 228,
            captionGap: 4, // caption mb-1
            selectorHeight: 28,
            balanceGap: 6, // pill mt-1.5
            balanceHeight: 52,
        },
        body: {
            padTop: 12, // pt-3
            padX: 10, // px-2.5
            padBottom: 12, // pb-3
            navGap: 4, // gap-[4px]
            navRowHeight: 25.5, // py-[3px] + 13px × 1.5 line
            sectionHeaderMarginTop: 14, // mt-[14px]
            sectionHeaderMarginBottom: 1, // mb-px
            listMarginTop: 2, // mt-0.5
            listIndent: 12, // pl-3
            featuredGap: 4, // gap-[4px]
            groupsGap: 2, // gap-[2px]
        },
        settings: { padTop: 4, padX: 10, padBottom: 4 }, // pinned above the user card
        userCardHeight: 61, // border-t 1 + p-2.5 + (py-1 + 32 avatar)
        // Top edge of each element in screen px (derived: line-height 1.5).
        rowsY: {
            brand: 8,
            teamCaption: 70,
            teamSelector: 91.25,
            balance: 125.25,
            nav: [193.25, 222.75, 252.25, 281.75],
            featuredHeader: 321.25,
            featuredRows: [349.5, 379, 408.5],
            groupsHeader: 448,
            groupRows: [476.25, 503.75],
            settings: 669.5,
            userCard: 699,
        },
        decor: {
            bloom: { left: -24, top: -32, width: 224, height: 160, blur: 16 },
            scatter: { height: 224, cell: 20, fill: 0.5, corner: "bl", opacity: 0.9 },
        },

        // ── Collapsed rail (sidebar.tsx mode="rail") ─────────────────────────
        // A pure WIDTH morph: every height, vertical padding/gap and rowsY above
        // is unchanged, so nothing moves vertically. The parts fold their own
        // content (labels, toggle, selector, pill, gauge); containers only
        // animate the values below.
        collapsed: {
            width: RAIL_W, // aside + its inner column (both transition width)
            contentWidth: 60, // RAIL_W − padLeft
            team: { innerWidth: 40, selectorWidth: 36, balanceWidth: 36 }, // selector + pill fold to w-9 themselves
            body: { innerWidth: 40, listIndent: 0 }, // Featured/Groups lists: pl-3 → pl-0
            // The bloom is `position: fixed` in the app, so the narrow aside does
            // NOT clip it: keep it outside the rail's overflow clip, at (−24, −32)
            // from the screen corner, painted under the sidebar content. The pixel
            // scatter stays clipped to the rail (w-full of the aside; it re-tiles
            // as the width changes, like the app's ResizeObserver does).
            decor: { bloomClippedToRail: false, scatterWidth: RAIL_W },
            transition: {
                duration: 500, // ms (duration-500)
                ease: SIDEBAR_EASE,
                /** aside width (and the inner column, if it has its own width). */
                width: `width 500ms ${SIDEBAR_EASE}`,
                /** The two section lists' padding-left (transition-[padding] duration-500). */
                listIndent: `padding 500ms ${SIDEBAR_EASE}`,
                /** framer `layout="position"` on the section lists (SidebarSectionHeader
                 *  carries its own). Only moves anything when a list's height changes
                 *  on collapse — the app forces closed sections open and drops their
                 *  empty-state text in the rail. framer's default layout transition. */
                layout: { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
            },
            // The main column is the aside's flex sibling, so the topbar and panel
            // ride the SAME width transition: animate their left + width together.
            shell: {
                x: RAIL_W, // topbar.x, panel.x
                width: 1200 - RAIL_W, // 1132 — topbar.width, panel.width
                transition: `left 500ms ${SIDEBAR_EASE}, width 500ms ${SIDEBAR_EASE}`,
            },
        },
    },

    topbar: {
        x: 256,
        y: 8, // right column pt-2
        width: 944,
        height: 56, // h-14
        padX: 20, // sm:px-5
        gap: 12, // sm:gap-3 (crumbs ↔ actions)
        actionsGap: 10, // sm:gap-2.5 (search ↔ bell)
        searchWidth: 200,
        controlSize: 36, // search height, bell box
        crumbGap: 6,
    },

    panel: {
        x: 256,
        y: 64,
        width: 944, // bleeds off the right edge
        height: 696, // bleeds off the bottom edge
        radiusTopLeft: 22,
        shadow: "var(--shadow-panel)",
    },

    page: {
        padX: 28, // sm:px-7
        padY: 28, // sm:py-7
        sectionGap: 24, // gap-6 between header / groups strip / org grid
        contentWidth: 888,
    },

    header: { gap: 16, actionsGap: 8, titleToSubtitle: 4, subtitleMaxWidth: "65ch" },

    groupsStrip: { headingToChips: 8, chipGap: 8, titleToSubtitle: 2 },

    orgGrid: {
        orgGap: 20, // gap-5 between org sections
        headerToTiles: 10, // org header mb-2.5
        columns: 2, // auto-fill minmax(320px, 1fr) in 888px
        tileMinWidth: 320,
        tileGap: 16, // gap-4
        tileWidth: 436,
        tileHeight: 144, // 143.75 with a progress footer; 139.25 with a text footer
    },
} as const

// ════════════════════════════════════════════════════════════════════════════
// Demo data
// ════════════════════════════════════════════════════════════════════════════

export type ProjectStatus =
    | { kind: "progress"; done: number; total: number }
    | { kind: "clear" }
    | { kind: "critical"; count: number }
    | { kind: "pr"; count: number }

export type ProjectIconName = "bag" | "bank-card" | "iphone" | "database" | "book" | "graph"

export type Tone = "blue" | "amber" | "rose" | "emerald" | "violet" | "indigo" | "cyan" | "zinc"

export type DemoOrg = {
    key: string
    name: string
    /** --app-* chip pair; the hash-picked chip the real app gives this owner key. */
    chip: { bg: string; fg: string }
    /** Stubbed people count (hash-derived in the real app). */
    people: number
    /** The real grid defaults to all-collapsed and remembers opened orgs. */
    open: boolean
}

export type DemoProject = {
    id: string
    name: string
    repo: string
    description: string
    org: string
    icon: ProjectIconName
    /** Sidebar MiniIcon tone (toneFromString(name) in the real app). */
    tone: Tone
    status: ProjectStatus
    /** Footer time text (timeAgo of the status subject). */
    ago: string
    /** "Updated" row (non-minimal tile only). */
    updated: string
}

export const DEMO_TEAM = { name: "Bobby Lab", personal: false }

export const DEMO_USER = { name: "Mara Lin", email: "mara@storefront.dev", initials: "ML" }

export const DEMO_BALANCE = {
    remaining: 1240,
    used: 760,
    allowance: 2000,
    fraction: 0.38,
    isExhausted: false,
    uncapped: false,
}

export const DEMO_ORGS: DemoOrg[] = [
    { key: "acme", name: "Acme", chip: { bg: "var(--app-cyan-bg)", fg: "var(--app-cyan)" }, people: 7, open: true },
    { key: "northwind", name: "Northwind", chip: { bg: "var(--app-clay-bg)", fg: "var(--app-clay)" }, people: 14, open: true },
    { key: "bobby-lab", name: "Bobby Lab", chip: { bg: "var(--app-indigo-bg)", fg: "var(--app-indigo)" }, people: 3, open: false },
]

export const DEMO_PROJECTS: DemoProject[] = [
    {
        id: "storefront",
        name: "Storefront",
        repo: "acme/storefront",
        description: "Web shop and checkout",
        org: "acme",
        icon: "bag",
        tone: "cyan",
        status: { kind: "progress", done: 12, total: 20 },
        ago: "2h ago",
        updated: "Oct 31, 2026",
    },
    {
        id: "billing-service",
        name: "Billing service",
        repo: "acme/billing-service",
        description: "Invoices, plans and payment webhooks",
        org: "acme",
        icon: "bank-card",
        tone: "violet",
        status: { kind: "critical", count: 2 },
        ago: "35m ago",
        updated: "Oct 31, 2026",
    },
    {
        id: "mobile",
        name: "Mobile app",
        repo: "acme/mobile",
        description: "iOS and Android client",
        org: "acme",
        icon: "iphone",
        tone: "violet",
        status: { kind: "pr", count: 3 },
        ago: "1h ago",
        updated: "Oct 30, 2026",
    },
    {
        id: "data-pipeline",
        name: "Data pipeline",
        repo: "northwind/data-pipeline",
        description: "Nightly ingest into the warehouse",
        org: "northwind",
        icon: "database",
        tone: "indigo",
        status: { kind: "clear" },
        ago: "3d ago",
        updated: "Oct 28, 2026",
    },
    {
        id: "docs-site",
        name: "Docs site",
        repo: "northwind/docs-site",
        description: "Public developer documentation",
        org: "northwind",
        icon: "book",
        tone: "blue",
        status: { kind: "progress", done: 7, total: 9 },
        ago: "5h ago",
        updated: "Oct 31, 2026",
    },
    {
        id: "analyser",
        name: "Analyser",
        repo: "bobby-lab/analyser",
        description: "Codebase knowledge graph and review bot",
        org: "bobby-lab",
        icon: "graph",
        tone: "cyan",
        status: { kind: "pr", count: 1 },
        ago: "4h ago",
        updated: "Oct 31, 2026",
    },
]

/** Sidebar "Featured" — the head of the projects list. */
export const DEMO_FEATURED: DemoProject[] = DEMO_PROJECTS.slice(0, 3)

/** Projects page "Groups" strip (ProjectGroup bundles). */
export const DEMO_PROJECT_GROUPS = [
    { id: "checkout", name: "Checkout", count: 3 },
    { id: "data-platform", name: "Data platform", count: 2 },
    { id: "lab-tools", name: "Lab tools", count: 2 },
]

/** Sidebar "Groups" — the team's people-groups (access control). */
export const DEMO_ACCESS_GROUPS = [
    { id: "engineering", name: "Engineering" },
    { id: "design", name: "Design" },
]

export const orgByKey = (key: string): DemoOrg => DEMO_ORGS.find((o) => o.key === key) ?? DEMO_ORGS[0]
export const projectsForOrg = (key: string): DemoProject[] => DEMO_PROJECTS.filter((p) => p.org === key)

// ════════════════════════════════════════════════════════════════════════════
// Icons (exact SVGs from the source)
// ════════════════════════════════════════════════════════════════════════════

function RepoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4V4z" />
            <path d="M4 16a4 4 0 014-4h12" />
        </svg>
    )
}
function GroupsIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 18a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 19a3 3 0 0 1 3-3M19 19a3 3 0 0 0-3-3" />
        </svg>
    )
}
function SessionsIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
    )
}
function WorkersIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="7" y="7" width="10" height="10" rx="1.5" />
            <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
    )
}
function GroupLeafIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="8" r="3" />
            <path d="M15.5 8a3 3 0 1 0 0 .01M4 20a5 5 0 0 1 10 0M14 20a5 5 0 0 1 6-4.5" />
        </svg>
    )
}
function SettingsIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}
function PanelIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="M9 4v16" />
        </svg>
    )
}
function LogoutIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
    )
}
/** Sidebar section caret (rotates −90° when closed). */
function SectionCaret({ open }: { open: boolean }) {
    return (
        <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="text-[color:var(--c-text-dim)] transition-transform"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}
function TeamCaret() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-[color:var(--c-text-dim)]">
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}
function SearchIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
        </svg>
    )
}
function BellIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    )
}
/** Groups strip chip folder (13px, dim). */
function FolderIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-[color:var(--c-text-dim)]">
            <path d="M3 7h7l1.5 2H21v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
    )
}
/** Org header chevron (points right, 90° when open). */
function OrgChevron({ open }: { open: boolean }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0 text-[color:var(--c-text-dim)]"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
            <path d="M9 6l6 6-6 6" />
        </svg>
    )
}
function RepoMini() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4V4z" />
            <path d="M4 16a4 4 0 014-4h12" />
        </svg>
    )
}
function ClockIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    )
}
function CheckCircleIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-[color:var(--tw4-emerald-500)]">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
    )
}
function PrIcon({ className }: { className?: string }) {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M6 8.5v7M18 15.5V13a3 3 0 0 0-3-3H9" />
        </svg>
    )
}

const BobbyMark = () => (
    <svg width={18} height={18} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
            fill="currentColor"
            d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"
        />
    </svg>
)

// ─── Iconly project glyphs (icons/Iconly-*-icon.tsx, Bold set) ───────────────
// Wrapped exactly like IconlyIcon: an inline-flex span sized to the glyph.

const ICONLY: Record<ProjectIconName, (size: number) => ReactNode> = {
    bag: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <g stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd">
                <g transform="translate(3.000000, 2.000000)" fill="currentColor" fillRule="nonzero">
                    <path d="M9.00494392,-1.77635684e-14 C11.684893,-1.77635684e-14 13.8881654,2.10590955 14,4.77432394 L13.9738707,4.77432394 C13.977008,4.85188923 13.9621034,4.9291268 13.9303218,5 L14.0864529,5 C15.3034636,5 16.5778419,5.8435091 17.0888377,7.87980254 L17.1443642,8.12007277 L17.913261,14.3147362 C18.46659,18.2657474 16.3049606,19.9272845 13.3562029,19.997658 L13.158474,20 L4.86852947,20 C1.87177637,20 -0.437455746,18.9079745 0.0702808406,14.5835537 L0.104904598,14.3147362 L0.882639271,8.12007277 C1.26614074,5.92718531 2.55360997,5.06224784 3.79411983,5.00326364 L3.9317127,5 L4.00988785,5 C3.99670405,4.92534832 3.99670405,4.84897562 4.00988785,4.77432394 C4.1217224,2.10590955 6.32499483,-1.77635684e-14 9.00494392,-1.77635684e-14 Z M6.09699673,8.32929048 C5.60889332,8.32929048 5.21320733,8.73655117 5.21320733,9.23893269 C5.21320733,9.74131421 5.60889332,10.1485749 6.09699673,10.1485749 C6.58510014,10.1485749 6.98078613,9.74131421 6.98078613,9.23893269 L6.98078613,9.23893269 L6.97390016,9.1248291 C6.91936452,8.6763055 6.54755372,8.32929048 6.09699673,8.32929048 Z M11.8858173,8.32929048 C11.3977139,8.32929048 11.0020279,8.73655117 11.0020279,9.23893269 C11.0020279,9.74131421 11.3977139,10.1485749 11.8858173,10.1485749 C12.3739207,10.1485749 12.7696067,9.74131421 12.7696067,9.23893269 C12.7696067,8.73655117 12.3739207,8.32929048 11.8858173,8.32929048 Z M8.96574994,1.30238454 C7.04163953,1.30238454 5.48183986,2.85682476 5.48183986,4.77432394 C5.49502365,4.84897562 5.49502365,4.92534832 5.48183986,5 L12.4932089,5 C12.4653783,4.92794354 12.4506323,4.85152772 12.44966,4.77432394 C12.44966,2.85682476 10.8898603,1.30238454 8.96574994,1.30238454 Z" />
                </g>
            </g>
        </svg>
    ),
    "bank-card": (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M12.21 15.9194H10.782C10.368 15.9194 10.032 15.5834 10.032 15.1694C10.032 14.7554 10.368 14.4194 10.782 14.4194H12.21C12.624 14.4194 12.96 14.7554 12.96 15.1694C12.96 15.5834 12.624 15.9194 12.21 15.9194ZM8.32598 15.9194H6.89798C6.48398 15.9194 6.14798 15.5834 6.14798 15.1694C6.14798 14.7554 6.48398 14.4194 6.89798 14.4194H8.32598C8.73998 14.4194 9.07598 14.7554 9.07598 15.1694C9.07598 15.5834 8.73998 15.9194 8.32598 15.9194ZM2.80098 10.5894C2.63529 10.5894 2.50098 10.7237 2.50098 10.8894V15.2894C2.50098 18.0824 4.29498 19.9594 6.96398 19.9594H17.034C19.705 19.9594 21.499 18.0824 21.499 15.2894V10.8894C21.499 10.7237 21.3647 10.5894 21.199 10.5894H2.80098Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.1991 9.08906C21.3648 9.08906 21.4991 8.95475 21.4991 8.78906V8.70906C21.4991 5.91606 19.7051 4.03906 17.0351 4.03906H6.9641C4.2951 4.03906 2.5011 5.91606 2.5011 8.70906V8.78906C2.5011 8.95475 2.63541 9.08906 2.8011 9.08906H21.1991Z" fill="currentColor" />
        </svg>
    ),
    iphone: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M18.55 14.15C18.7157 14.15 18.85 14.0157 18.85 13.85V6.599C18.85 4.338 17.011 2.5 14.75 2.5H9.25002C6.98902 2.5 5.15002 4.338 5.15002 6.599V13.85C5.15002 14.0157 5.28434 14.15 5.45002 14.15H18.55Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M11.9999 19.2704C11.4669 19.2704 11.0499 18.8534 11.0499 18.3204C11.0499 17.7764 11.5519 17.3704 11.9999 17.3704C12.4479 17.3704 12.9499 17.7764 12.9499 18.3204C12.9499 18.8644 12.4479 19.2704 11.9999 19.2704ZM5.4499 15.6494C5.28422 15.6494 5.1499 15.7837 5.1499 15.9494V17.3994C5.1499 19.6604 6.9889 21.4994 9.2499 21.4994H14.7499C17.0109 21.4994 18.8499 19.6604 18.8499 17.3994V15.9494C18.8499 15.7837 18.7156 15.6494 18.5499 15.6494H5.4499Z" fill="currentColor" />
        </svg>
    ),
    database: (size) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M4.4461 12.9302C4.8641 13.3722 5.3751 13.6492 5.9081 13.8812C6.6911 14.2212 7.5061 14.4342 8.3341 14.5942C9.1441 14.7512 9.9591 14.8472 10.7781 14.8922C12.3621 14.9792 13.9391 14.9082 15.5061 14.6262C16.4591 14.4542 17.3951 14.2112 18.2861 13.7952C18.7621 13.5732 19.2161 13.3082 19.5841 12.8992C19.8411 12.6142 19.9781 12.2822 19.9741 11.8712C19.9663 10.9668 19.9652 9.29909 19.9636 8.58777C19.9633 8.43646 19.806 8.34946 19.6769 8.42853C19.6026 8.47412 19.5293 8.51816 19.4551 8.56019C18.1621 9.29219 16.7631 9.62819 15.3361 9.84519C14.6711 9.94619 14.0001 10.0062 13.3301 10.0532C12.0331 10.1452 10.7371 10.1022 9.4441 9.95519C8.5091 9.84919 7.5831 9.67919 6.6711 9.42119C5.9501 9.21619 5.2451 8.96219 4.5841 8.58219C4.50093 8.53406 4.41841 8.48419 4.33369 8.43237C4.2008 8.35107 4.03162 8.44573 4.03198 8.60152C4.03367 9.32314 4.03644 10.964 4.0271 11.8492C4.0221 12.2862 4.1671 12.6352 4.4461 12.9302Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M19.9704 14.9889C19.9705 14.9208 19.8975 14.8839 19.8377 14.9164C19.4627 15.1194 19.0967 15.3484 18.7097 15.5204C17.3387 16.1284 15.8967 16.4114 14.4317 16.5784C13.5427 16.6784 12.6507 16.7114 11.7577 16.7054C10.8837 16.6994 10.0117 16.6554 9.14669 16.5254C8.41069 16.4154 7.67769 16.2724 6.95069 16.1024C6.10069 15.9034 5.27869 15.6044 4.50969 15.1494C4.45167 15.1152 4.39408 15.0804 4.3354 15.0445C4.2022 14.9629 4.03247 15.0573 4.03302 15.2135C4.03556 15.9305 4.03966 17.5482 4.02569 18.4214C4.01669 18.9444 4.21369 19.3314 4.56169 19.6554C4.96569 20.0314 5.43469 20.2824 5.92469 20.4904C6.79669 20.8604 7.70369 21.0834 8.62569 21.2414C9.50069 21.3924 10.3817 21.4764 11.2667 21.5034C12.7907 21.5514 14.3067 21.4624 15.8087 21.1624C16.6727 20.9894 17.5197 20.7584 18.3277 20.3744C18.7877 20.1554 19.2257 19.8954 19.5817 19.4994C19.8417 19.2104 19.9777 18.8744 19.9747 18.4594C19.9661 17.4697 19.9693 15.5502 19.9704 14.9889Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.54502 6.44468C5.00302 6.88268 5.54802 7.15468 6.11302 7.38168C7.13203 7.79068 8.19103 8.01468 9.26503 8.15968C10.171 8.28168 11.082 8.34368 11.817 8.33268C13.531 8.33468 15.051 8.19068 16.548 7.81268C17.293 7.62468 18.022 7.37968 18.704 6.99268C19.079 6.78068 19.429 6.53168 19.7 6.16968C20.058 5.68968 20.064 5.13068 19.699 4.65768C19.575 4.49568 19.43 4.34568 19.275 4.21868C18.694 3.74368 18.025 3.46768 17.338 3.23968C16.114 2.83468 14.856 2.63468 13.584 2.54468C11.848 2.42068 10.119 2.48368 8.40102 2.80368C7.46802 2.97668 6.55303 3.21968 5.68202 3.63068C5.21702 3.84968 4.77402 4.11068 4.41802 4.51268C4.12202 4.84668 3.94802 5.22768 4.07302 5.70468C4.15202 6.00868 4.33202 6.24168 4.54502 6.44468Z" fill="currentColor" />
        </svg>
    ),
    book: (size) => (
        <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M9.39211 16.4805C9.39211 16.6462 9.52643 16.7805 9.69211 16.7805H18.6726C18.8381 16.7805 18.9723 16.9145 18.9726 17.08C18.9726 17.08 18.9733 17.5254 18.9738 17.8108C18.9748 18.3966 18.9763 19.3108 18.9763 19.3108L18.9771 19.8085C18.9761 20.0515 18.7751 20.2505 18.5281 20.2505H7.32611C6.36811 20.2505 5.58911 19.4695 5.58911 18.5095C5.58911 17.5555 6.36811 16.7805 7.32611 16.7805H7.59211C7.7578 16.7805 7.89211 16.6462 7.89211 16.4805V2.55C7.89211 2.38431 7.7578 2.25 7.59211 2.25H7.43033C5.58833 2.25 4.08932 3.748 4.08932 5.59V18.4721L4.08911 18.5095C4.08911 20.2975 5.54111 21.7505 7.32611 21.7505H18.5281C19.5991 21.7505 20.4741 20.8815 20.4771 19.8095L20.4701 16.0476L20.4703 16.031V4.2C20.4703 3.125 19.5963 2.25 18.5213 2.25H9.69211C9.52643 2.25 9.39211 2.38431 9.39211 2.55V16.4805ZM12.2633 7.88013H13.7363C14.1503 7.88013 14.4863 7.54413 14.4863 7.13013C14.4863 6.71613 14.1503 6.38013 13.7363 6.38013H12.2633C11.8493 6.38013 11.5133 6.71613 11.5133 7.13013C11.5133 7.54413 11.8493 7.88013 12.2633 7.88013ZM12.2633 10.7701H15.5913C16.0063 10.7701 16.3413 10.4341 16.3413 10.0201C16.3413 9.60613 16.0063 9.27013 15.5913 9.27013H12.2633C11.8493 9.27013 11.5133 9.60613 11.5133 10.0201C11.5133 10.4341 11.8493 10.7701 12.2633 10.7701Z" fill="currentColor" />
        </svg>
    ),
    graph: (size) => (
        <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M21.7684 7.74274C21.3314 5.65674 18.6694 3.09974 16.2894 2.48074C15.1224 2.17574 14.1384 2.40374 13.5184 3.11774C12.6574 4.10974 12.3724 9.55974 13.3764 10.5637C13.7864 10.9737 14.8214 11.1477 16.0134 11.1477C17.9034 11.1477 20.1854 10.7097 20.9944 10.0737C21.6934 9.52374 21.9684 8.69574 21.7684 7.74274Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M15.3817 12.9723C13.9727 13.0183 12.3777 13.0683 11.6877 12.3783C10.9407 11.6303 10.8827 9.98127 10.8357 8.65527C10.7917 7.40327 10.7567 6.41327 10.2487 5.90627C9.65572 5.31327 8.66472 5.24327 7.53072 5.71127C5.17372 6.68827 2.66772 9.73327 2.66772 13.4513C2.66772 17.9723 6.34672 21.6513 10.8687 21.6513C15.2897 21.6513 17.8627 18.2853 18.6867 16.2973C19.2057 15.0453 19.2137 14.0373 18.7087 13.5343C18.0617 12.8863 16.8177 12.9283 15.3817 12.9723Z" fill="currentColor" />
        </svg>
    ),
}

export function IconlyIcon({ name, size = 18, className }: { name: ProjectIconName; size?: number; className?: string }) {
    return (
        <span className={className} style={{ display: "inline-flex", width: size, height: size }}>
            {ICONLY[name](size)}
        </span>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Primitives (components/ui/field-card.tsx)
// ════════════════════════════════════════════════════════════════════════════

// Tailwind v4 named colours, pinned to their exact v4 OKLCH values (see CSS).
const TONE: Record<Tone, string> = {
    blue: "bg-[color:var(--tw4-blue-50)] text-[color:var(--tw4-blue-600)]",
    amber: "bg-[color:var(--tw4-amber-50)] text-[color:var(--tw4-amber-600)]",
    rose: "bg-[color:var(--tw4-rose-50)] text-[color:var(--tw4-rose-600)]",
    emerald: "bg-[color:var(--tw4-emerald-50)] text-[color:var(--tw4-emerald-600)]",
    violet: "bg-[color:var(--tw4-violet-50)] text-[color:var(--tw4-violet-600)]",
    indigo: "bg-[color:var(--tw4-indigo-50)] text-[color:var(--tw4-indigo-600)]",
    cyan: "bg-[color:var(--tw4-cyan-50)] text-[color:var(--tw4-cyan-600)]",
    zinc: "bg-[color:var(--c-surface-2)] text-[color:var(--c-text-muted)]",
}

export function MiniIcon({ tone = "zinc", size = 36, className, style, children }: PartProps & { tone?: Tone; size?: number; children: ReactNode }) {
    return (
        <span className={cx("mini-icon", TONE[tone], className)} style={{ width: size, height: size, ...style }} aria-hidden>
            {children}
        </span>
    )
}

export function FieldTable({ className, style, children }: PartProps & { children: ReactNode }) {
    return (
        <div className={cx("field-table", className)} style={style}>
            {children}
        </div>
    )
}

export function FieldRow({ icon, label, children }: { icon?: ReactNode; label: ReactNode; children: ReactNode }) {
    return (
        <div className="field-row">
            <span className="field-label">
                {icon}
                {label}
            </span>
            <span className="field-value">{children}</span>
        </div>
    )
}

/** Segmented progress — discrete ticks. */
export function SegBar({ value, total, max = 12, className, style }: PartProps & { value: number; total: number; max?: number }) {
    const count = Math.min(max, Math.max(total, 1))
    const on = total > 0 ? Math.round((value / total) * count) : 0
    return (
        <span className={cx("seg-track", className)} style={style} aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className={cx("seg", i < on && "seg-on")} />
            ))}
        </span>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Sidebar decor — ember bloom + pixel-scatter texture
// ════════════════════════════════════════════════════════════════════════════

/** The warm flare behind the top of the rail. In the app it is `position: fixed`
 *  at the viewport corner (= the sidebar's corner); here it is absolute against
 *  its positioned parent at the same (−24, −32) offset. */
export function SidebarBloom({ className, style }: PartProps) {
    return (
        <div
            aria-hidden
            className={cx(
                "pointer-events-none absolute -left-6 -top-8 h-40 w-56 bg-[radial-gradient(58%_58%_at_20%_16%,rgba(234,88,12,0.20),rgba(245,158,11,0.12)_45%,transparent_74%)] blur-[16px]",
                className,
            )}
            style={style}
        />
    )
}

// EMBER_STOPS.slice(0, 5) from components/ui/pixel-gradient.tsx
const SCATTER_COLORS: [number, number, number][] = [
    [233, 116, 18],
    [245, 152, 30],
    [249, 184, 58],
    [251, 210, 106],
    [253, 230, 162],
]

const rand = (s: number) => {
    const x = Math.sin(s) * 43758.5453
    return x - Math.floor(x)
}

type Corner = "tl" | "tr" | "bl" | "br"

/** Port of components/ui/pixel-scatter.tsx — fills its positioned parent. */
export function PixelScatter({
    cell = 48,
    fill = 0.13,
    corners = ["tl", "br"],
    reach = 0.72,
    falloff = 1,
    animate = true,
    className = "",
}: {
    cell?: number
    fill?: number
    corners?: Corner[]
    reach?: number
    falloff?: number
    animate?: boolean
    className?: string
}) {
    const ref = useRef<HTMLCanvasElement>(null)
    const cornersKey = corners.join(",")

    useEffect(() => {
        const canvas = ref.current
        const host = canvas?.parentElement
        if (!canvas || !host) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const lit = cornersKey.split(",") as Corner[]
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        type Amber = { col: [number, number, number]; op: number; tw: boolean; amp: number; phase: number; period: number }
        type Cell = { x: number; y: number; baseOp: number; amber: Amber | null }
        let cells: Cell[] = []
        let w = 0
        let h = 0

        const build = () => {
            w = host.clientWidth
            h = host.clientHeight
            if (!w || !h) return
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            const cols = Math.ceil(w / cell) + 1
            const rows = Math.ceil(h / cell) + 1
            cells = []
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const seed = r * 73.13 + c * 19.71 + 1
                    const fx = cols > 1 ? c / (cols - 1) : 0
                    const fy = rows > 1 ? r / (rows - 1) : 0
                    let cwLin = 0
                    for (const k of lit) {
                        const kx = k[1] === "l" ? 0 : 1
                        const ky = k[0] === "t" ? 0 : 1
                        cwLin = Math.max(cwLin, 1 - Math.min(1, Math.hypot(fx - kx, fy - ky) / reach))
                    }
                    const cw = falloff === 1 ? cwLin : Math.pow(cwLin, falloff)
                    const baseOp = cw * (0.05 + rand(seed * 11.3) * 0.05)
                    let amber: Amber | null = null
                    if (cw > 0.04 && rand(seed) <= fill * cw) {
                        amber = {
                            col: SCATTER_COLORS[Math.floor(rand(seed * 1.7) * SCATTER_COLORS.length)],
                            op: (0.5 + rand(seed * 2.3) * 0.45) * Math.min(1, 0.45 + cw),
                            tw: rand(seed * 3.9) < 0.28,
                            amp: 0.45 + rand(seed * 5.1) * 0.4,
                            phase: rand(seed * 6.7),
                            period: 4 + rand(seed * 8.3) * 5,
                        }
                    }
                    cells.push({ x: c * cell, y: r * cell, baseOp, amber })
                }
            }
        }

        const render = (tSec: number) => {
            if (!w || !h) return
            ctx.clearRect(0, 0, w, h)
            for (const c of cells) {
                ctx.fillStyle = `rgba(150,140,122,${c.baseOp})`
                ctx.fillRect(c.x, c.y, cell, cell)
                if (c.amber) {
                    let op = c.amber.op
                    if (c.amber.tw && !reduce && animate) {
                        const cyc = (((tSec / c.amber.period + c.amber.phase) % 1) + 1) % 1
                        const blinkFrac = 0.08
                        let level = 1
                        if (cyc < blinkFrac) level = 1 - c.amber.amp * Math.sin(Math.PI * (cyc / blinkFrac))
                        op = c.amber.op * level
                    }
                    ctx.fillStyle = `rgba(${c.amber.col[0]},${c.amber.col[1]},${c.amber.col[2]},${op})`
                    ctx.fillRect(c.x, c.y, cell, cell)
                }
            }
        }

        build()
        render(0)

        let raf = 0
        if (!reduce && animate) {
            const loop = (t: number) => {
                render(t * 0.001)
                raf = requestAnimationFrame(loop)
            }
            raf = requestAnimationFrame(loop)
        }

        const ro = new ResizeObserver(() => {
            build()
            if (reduce || !animate) render(0)
        })
        ro.observe(host)
        return () => {
            ro.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
    }, [cell, fill, reach, falloff, animate, cornersKey])

    return <canvas ref={ref} aria-hidden className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
}

/** Ember pixel bloom from the rail's bottom-left corner (static, as in the app). */
export function SidebarEmberScatter({ className, style }: PartProps) {
    return (
        <div aria-hidden className={cx("pointer-events-none absolute bottom-0 left-0 h-56 w-full overflow-hidden", className)} style={style}>
            <PixelScatter corners={["bl"]} cell={20} fill={0.5} animate={false} className="opacity-90" />
        </div>
    )
}

/** Both decorative layers, clipped to the sidebar box. Absolute inset-0 — place
 *  it first inside a `relative` 256 × full-height sidebar container. */
export function SidebarDecor({ className, style }: PartProps) {
    return (
        <div aria-hidden className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)} style={style}>
            <SidebarBloom />
            <SidebarEmberScatter />
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Sidebar
// ════════════════════════════════════════════════════════════════════════════

// Row states: active = raised white pill; idle = faint border-tinted pill.
// (v4 `bg-[color:var(--c-border)]/50` = color-mix in oklab at 50%.)
const ROW_ACTIVE =
    "bg-[color:var(--c-surface)] font-semibold text-[color:var(--c-text)] shadow-[0_1px_3px_rgba(180,83,9,0.12)] ring-1 ring-[color:var(--c-border-strong)]"
const ROW_IDLE = "text-[color:var(--c-text-muted)] bg-[color:color-mix(in_oklab,var(--c-border)_50%,transparent)]"

const BRAND_EMBER_8X8 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAkUlEQVR4AXzOvQqCYBTG8YezRZfQ1NDSDdTYEDU0RENL0N4lNHUfXUc30BqNToLgJIIiCOIXvr6POggi6vzj/M8j/D7ovff8PA983c+8HG/cbq5crU9cLHcU37TwswV/ZwbDm8MNCwRRgiSNkWUxZAqVyiFjlw1SK8hQtkXqEtL/2UWyLnQH9VE3hXbtEFIrVAAAAP//fjrJVAAAAAZJREFUAwBfaKlwTAiYngAAAABJRU5ErkJggg=="

/** Brand mark tile alone (32 × 32 ember pixel tile + white Bobby mark). */
export function SidebarBrandMark({ className, style }: PartProps) {
    return (
        <span
            className={cx(
                "relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] text-white shadow-[0_1px_4px_rgba(180,83,9,0.30)] ring-1 ring-[color:var(--c-border)]",
                className,
            )}
            style={{ backgroundImage: `url("${BRAND_EMBER_8X8}")`, backgroundSize: "100% 100%", imageRendering: "pixelated", ...style }}
        >
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
                <BobbyMark />
            </span>
        </span>
    )
}

/** A row label that folds to nothing on collapse (sidebar.tsx FoldingLabel).
 *  Kept mounted and animated on max-width, opacity AND its left margin, so the
 *  icon beside it never moves — the text slides shut. */
function FoldingLabel({
    collapsed,
    children,
    className,
    max = 180,
}: {
    collapsed: boolean
    children: ReactNode
    className?: string
    max?: number
}) {
    return (
        <span
            aria-hidden={collapsed}
            className={cx(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-500",
                collapsed ? "ml-0 max-w-0 opacity-0" : "opacity-100",
                className,
            )}
            style={{ maxWidth: collapsed ? 0 : max, marginLeft: collapsed ? 0 : undefined }}
        >
            {children}
        </span>
    )
}

/** Workspace header row: mark + "Ucelot" + collapse toggle. Width = 248.
 *  Collapsed: the label folds and the toggle folds away (max-width → 0, border
 *  drops, fades) — in the app the mark itself becomes the expand button. */
export function SidebarBrand({ collapsed = false, className, style }: PartProps & { collapsed?: boolean }) {
    return (
        <div className={cx("flex h-14 shrink-0 items-center px-3", className)} style={style}>
            <SidebarBrandMark />
            <FoldingLabel collapsed={collapsed} className="ml-2.5 min-w-0 truncate text-[14px] font-bold tracking-[-0.01em]" max={120}>
                Ucelot
            </FoldingLabel>
            <span
                aria-hidden
                className={cx(
                    "ml-auto grid h-7 shrink-0 place-items-center overflow-hidden rounded-[7px] text-[color:var(--c-text-dim)] transition-[max-width,opacity,border-color] duration-500",
                    collapsed ? "pointer-events-none max-w-0 border-0 opacity-0" : "w-7 max-w-[28px] border border-[color:var(--c-border)] opacity-100",
                )}
            >
                <PanelIcon />
            </span>
        </div>
    )
}

/** The "Team" caption above the selector (FoldRow): on collapse the text fades
 *  but the row KEEPS its height, so nothing below shifts up. */
export function SidebarTeamCaption({ collapsed = false, className, style }: PartProps & { collapsed?: boolean }) {
    return (
        <div
            aria-hidden={collapsed}
            className={cx(
                "max-h-8 overflow-hidden transition-opacity duration-500",
                collapsed ? "pointer-events-none opacity-0" : "opacity-100",
                className,
            )}
            style={style}
        >
            <div className="px-0.5 text-[11.5px] font-semibold tracking-wide text-[color:var(--c-text-muted)]">Team</div>
        </div>
    )
}

/** Team switcher trigger (closed). Full width (228 in the rail). Collapsed: the
 *  trigger narrows to a 36px (w-9) avatar button, left-aligned; name + caret fold. */
export function SidebarTeamSelector({
    team = DEMO_TEAM,
    collapsed = false,
    className,
    style,
}: PartProps & { team?: { name: string; personal: boolean }; collapsed?: boolean }) {
    const initial = team.name.trim()[0]?.toUpperCase() ?? "T"
    return (
        <div className={cx("relative", className)} style={style}>
            <div
                className={cx(
                    "flex h-7 items-center rounded-sq-l bg-[color:var(--c-surface)] text-[12.5px] font-semibold text-[color:var(--c-text)] shadow-[0_1px_1px_rgba(17,24,39,0.02)] ring-1 ring-[color:var(--c-border)] transition-[width,padding] duration-500",
                    collapsed ? "w-9 justify-center px-0" : "w-full pl-2.5 pr-4",
                )}
            >
                <span
                    className={cx(
                        "grid shrink-0 place-items-center rounded-[6px] font-bold text-white",
                        team.personal ? "bg-[color:var(--c-text-dim)]" : "bg-[color:var(--c-primary)]",
                    )}
                    style={{ width: 18, height: 18, fontSize: 10 }}
                    aria-hidden
                >
                    {initial}
                </span>
                <span
                    aria-hidden={collapsed}
                    className={cx(
                        "overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] duration-500",
                        collapsed ? "ml-0 max-w-0 opacity-0" : "ml-2 max-w-[150px] truncate opacity-100",
                    )}
                >
                    {team.name}
                </span>
                <span className={cx("overflow-hidden transition-[max-width,opacity] duration-500", collapsed ? "ml-0 max-w-0 opacity-0" : "ml-auto max-w-[16px] opacity-100")}>
                    <TeamCaret />
                </span>
            </div>
        </div>
    )
}

// ─── Credits pill (balance-pill.tsx) ─────────────────────────────────────────

const SEG_N = 12
const GAUGE_H = 48
const GAUGE_W_EXP = 104
const GAUGE_W_COL = 48
const G_CX = 24
const G_CY = 24
const RING_R = 15
const BAR_GAP = 8
const BAR_X0 = -16
const BAR_Y = 13
const FLAME_SIZE = 16
const FLAME_COL_SCALE = 1.15
const FLAME_DX = -9
const FLAME_DY = -10
const STAGGER = 0.5
const MORPH_MS = 520

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** The app's gauge driver (balance-pill.tsx FuelGauge): LINEAR progress 0 → 1
 *  (or back) over 520ms on rAF, starting from wherever it currently is, so a
 *  toggle mid-morph reverses smoothly. Easing is applied per dash in render. */
function useGaugeMorph(collapsed: boolean): number {
    const [p, setP] = useState(collapsed ? 1 : 0)
    const pRef = useRef(p)
    useEffect(() => {
        pRef.current = p
    }, [p])
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const goal = collapsed ? 1 : 0
        const from = pRef.current
        if (from === goal) return
        const startAt = performance.now()
        const step = (now: number) => {
            const t = Math.min(1, (now - startAt) / MORPH_MS)
            setP(from + (goal - from) * t)
            rafRef.current = t < 1 ? requestAnimationFrame(step) : null
        }
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(step)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [collapsed])

    return p
}

function FlameIcon({ color, size = 14 }: { color: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ color }}>
            <path d="M8 1.5c2.2 2.8 3.8 4.4 3.8 7A3.8 3.8 0 1 1 4.2 8.5c0-.9.3-1.7.8-2.4.3 1 .9 1.6 1.7 1.8-.3-2 .5-3.6 1.3-4.4Z" fill="currentColor" />
        </svg>
    )
}

/** The flame + 12-dash meter. `progress` is the app's LINEAR morph value:
 *  0 = straight bar under the flame (the expanded pill), 1 = dashes wrapped into
 *  a ring around the flame (the collapsed rail). Pass `collapsed` to have it
 *  morph itself with the app's timing; an explicit `progress` overrides that. */
export function FuelGauge({
    fraction = DEMO_BALANCE.fraction,
    accent = "var(--c-primary)",
    progress,
    collapsed = false,
    offsetExpanded = 8,
    offsetCollapsed = -6,
    className,
    style,
}: PartProps & {
    fraction?: number
    accent?: string
    progress?: number
    collapsed?: boolean
    offsetExpanded?: number
    offsetCollapsed?: number
}) {
    const morph = useGaugeMorph(collapsed)
    const p = Math.min(1, Math.max(0, progress ?? morph))
    const onCount = Math.min(SEG_N, Math.max(fraction > 0 ? 1 : 0, Math.round(fraction * SEG_N)))
    const gp = easeInOut(p)
    const width = GAUGE_W_EXP + (GAUGE_W_COL - GAUGE_W_EXP) * gp
    const shiftX = offsetExpanded + (offsetCollapsed - offsetExpanded) * gp
    const dashDur = 1 - STAGGER
    return (
        <span
            className={cx("relative block shrink-0", className)}
            style={{ width, height: GAUGE_H, transform: shiftX ? `translateX(${shiftX.toFixed(2)}px)` : undefined, ...style }}
            aria-hidden
        >
            {Array.from({ length: SEG_N }).map((_, i) => {
                const on = i < onCount
                const startI = (i / (SEG_N - 1)) * STAGGER
                const pi = easeInOut(Math.min(1, Math.max(0, (p - startI) / dashDur)))
                const xExp = BAR_X0 + i * BAR_GAP
                const rStart = Math.hypot(xExp, BAR_Y)
                const aStart = Math.atan2(BAR_Y, xExp)
                const psi = -(i / SEG_N) * 2 * Math.PI
                const aEnd = Math.atan2(-RING_R * Math.cos(psi), RING_R * Math.sin(psi))
                let d = aEnd - aStart
                while (d > Math.PI) d -= 2 * Math.PI
                while (d < -Math.PI) d += 2 * Math.PI
                const a = aStart + d * pi
                const r = rStart + (RING_R - rStart) * pi
                const px = G_CX + r * Math.cos(a)
                const py = G_CY + r * Math.sin(a)
                const rot = (psi * 180) / Math.PI
                return (
                    <span
                        key={i}
                        className="absolute left-0 top-0 h-[3px] w-[7px] rounded-full"
                        style={{
                            transform: `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px) translate(-50%,-50%) rotate(${(rot * pi).toFixed(1)}deg)`,
                            transformOrigin: "center",
                            backgroundColor: on ? accent : "var(--c-border-strong)",
                            opacity: on ? 1 : 0.5,
                            transition: "background-color 300ms ease, opacity 300ms ease",
                        }}
                    />
                )
            })}
            <span
                className="absolute left-0 top-0"
                style={{
                    transform: `translate(${(G_CX + FLAME_DX * (1 - gp)).toFixed(2)}px, ${(G_CY + FLAME_DY * (1 - gp)).toFixed(2)}px) translate(-50%,-50%) scale(${(1 + (FLAME_COL_SCALE - 1) * gp).toFixed(3)})`,
                    transformOrigin: "center",
                }}
            >
                <FlameIcon color={accent} size={FLAME_SIZE} />
            </span>
        </span>
    )
}

function fmtCredits(n: number): string {
    const v = Math.max(0, Math.round(n))
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    if (v >= 10_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}k`
    return v.toLocaleString("en-US")
}

/** Credits balance pill (healthy "ember" state). Full width × 52.
 *  Collapsed: the box narrows to a borderless, transparent 36 × 52 (w-9) pill
 *  over 300ms while the gauge's bar coils into a ring (520ms rAF) and the text
 *  fades out (300ms; on expand it fades back in after a 150ms delay). The height
 *  never changes, so nothing below moves. */
export function SidebarBalance({
    balance = DEMO_BALANCE,
    collapsed = false,
    className,
    style,
}: PartProps & { balance?: typeof DEMO_BALANCE; collapsed?: boolean }) {
    const accent = "var(--c-primary)"
    return (
        <div
            className={cx(
                "relative flex shrink-0 items-center overflow-hidden transition-[background-color,border-color,width,height,border-radius] duration-300",
                collapsed
                    ? "h-[52px] w-9 rounded-full border border-transparent bg-transparent"
                    : "h-[52px] w-full rounded-[12px] border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]",
                className,
            )}
            style={style}
        >
            <FuelGauge fraction={balance.fraction} accent={accent} collapsed={collapsed} offsetExpanded={8} offsetCollapsed={-6} />
            <span
                className={cx(
                    "pointer-events-none absolute inset-y-0 left-[38px] right-2.5 flex flex-col justify-center gap-[7px] whitespace-nowrap transition-opacity duration-300",
                    collapsed ? "opacity-0" : "opacity-100 delay-150",
                )}
            >
                <span className="flex items-center leading-none">
                    <span className="truncate text-[12.5px] font-semibold" style={{ color: "var(--c-text)" }}>
                        {fmtCredits(balance.remaining)}
                        <span className="ml-1 font-medium text-[color:var(--c-text-dim)]">credits</span>
                    </span>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ml-auto shrink-0 text-[color:var(--c-text-dim)]" aria-hidden>
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="flex items-center leading-none">
                    <span className="ml-auto text-[10.5px] font-semibold tabular-nums" style={{ color: "var(--c-text-dim)" }}>
                        {Math.round(balance.fraction * 100)}%
                    </span>
                </span>
            </span>
        </div>
    )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

export type SidebarNavEntry = { key: string; label: string; Icon: () => ReactNode; active: boolean }

/** The four fixed destinations, in order. Active: Projects. */
export const SIDEBAR_NAV: SidebarNavEntry[] = [
    { key: "projects", label: "Projects", Icon: RepoIcon, active: true },
    { key: "collections", label: "Collections", Icon: GroupsIcon, active: false },
    { key: "sessions", label: "Public sessions", Icon: SessionsIcon, active: false },
    { key: "workers", label: "Local models", Icon: WorkersIcon, active: false },
]

/** One nav row (w-max pill). Collapsed: the label folds and the right padding
 *  eases pr-4 → pr-2.5, leaving a square icon pill. */
export function SidebarNavItem({
    label,
    icon,
    active = false,
    collapsed = false,
    className,
    style,
}: PartProps & { label: string; icon: ReactNode; active?: boolean; collapsed?: boolean }) {
    return (
        <div
            className={cx(
                "flex w-max items-center rounded-sq-l py-[3px] pl-2.5 text-[13px] font-medium transition-[padding] duration-500",
                collapsed ? "pr-2.5" : "pr-4",
                active ? ROW_ACTIVE : ROW_IDLE,
                className,
            )}
            style={style}
        >
            <span className={cx("grid h-[18px] w-[18px] shrink-0 place-items-center", active ? "text-[color:var(--tw4-amber-500)]" : "text-[color:var(--c-text-dim)]")}>
                {icon}
            </span>
            <FoldingLabel collapsed={collapsed} className="ml-2 truncate">
                {label}
            </FoldingLabel>
        </div>
    )
}

/** Settings row, pinned above the user card (a nav row; folds the same way). */
export function SidebarSettings({ active = false, collapsed = false, className, style }: PartProps & { active?: boolean; collapsed?: boolean }) {
    return <SidebarNavItem label="Settings" icon={<SettingsIcon />} active={active} collapsed={collapsed} className={className} style={style} />
}

/** "Featured" / "Groups" caption with its down-caret. Full width.
 *  Collapsed: the caption fades but KEEPS its height, so the icons below hold
 *  their place. `layout="position"` as in the app: if the content above it
 *  changes height, it glides to its new y (framer default, 0.45s). */
export function SidebarSectionHeader({
    label,
    open = true,
    collapsed = false,
    className,
    style,
}: PartProps & { label: string; open?: boolean; collapsed?: boolean }) {
    return (
        <motion.div
            layout="position"
            aria-hidden={collapsed}
            className={cx(
                "flex max-h-8 w-full items-center gap-1.5 overflow-hidden px-1 py-1 text-[11.5px] font-semibold tracking-[0.01em] text-[color:var(--c-text-muted)] transition-opacity duration-500",
                collapsed ? "pointer-events-none opacity-0" : "opacity-100",
                className,
            )}
            style={style}
        >
            <span>{label}</span>
            <SectionCaret open={open} />
        </motion.div>
    )
}

/** A Featured project row: tinted letter disc + name (w-max pill).
 *  Collapsed: the name folds, leaving the disc in a square pill. */
export function SidebarProjectRow({
    project,
    active = false,
    collapsed = false,
    className,
    style,
}: PartProps & { project: DemoProject; active?: boolean; collapsed?: boolean }) {
    return (
        <div
            className={cx(
                "group flex w-max items-center rounded-[9px] py-[3px] pl-2.5 pr-2.5 text-[13px] transition-[padding,background-color] duration-500",
                active ? ROW_ACTIVE : ROW_IDLE,
                className,
            )}
            style={style}
        >
            <MiniIcon tone={project.tone} size={18}>
                <span className="text-[9px] font-bold uppercase">{project.name[0] ?? "?"}</span>
            </MiniIcon>
            <FoldingLabel collapsed={collapsed} className="ml-2.5 truncate">
                {project.name}
            </FoldingLabel>
        </div>
    )
}

/** A people-group row: emerald leaf chip + name (w-max pill).
 *  Collapsed: the name folds, leaving the chip in a square pill. */
export function SidebarGroupRow({ name, collapsed = false, className, style }: PartProps & { name: string; collapsed?: boolean }) {
    return (
        <div className={cx("flex w-max items-center rounded-sq-l py-[3px] pl-2.5 pr-2.5 text-[13px]", ROW_IDLE, className)} style={style}>
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] bg-[color:var(--tw4-emerald-50)] text-[color:var(--tw4-emerald-600)]">
                <GroupLeafIcon />
            </span>
            <FoldingLabel collapsed={collapsed} className="ml-2.5 truncate text-left">
                {name}
            </FoldingLabel>
        </div>
    )
}

/** Account card pinned at the bottom: hairline top border + avatar, name,
 *  email, sign-out. Includes its own border-t + p-2.5 (width 248).
 *  Collapsed: folds to just the avatar — name/email and sign-out fold away. */
export function SidebarUserCard({ user = DEMO_USER, collapsed = false, className, style }: PartProps & { user?: typeof DEMO_USER; collapsed?: boolean }) {
    return (
        <div className={cx("shrink-0 border-t border-[color:var(--c-border)] p-2.5", className)} style={style}>
            <div className="flex items-center px-1.5 py-1">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--c-border)] text-[11px] font-bold text-[color:var(--c-text-muted)]">
                    {user.initials}
                </span>
                <div
                    aria-hidden={collapsed}
                    className={cx(
                        "min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-500",
                        collapsed ? "ml-0 max-w-0 opacity-0" : "ml-2.5 max-w-[160px] flex-1 opacity-100",
                    )}
                >
                    <div className="truncate text-[12.5px] font-semibold leading-tight">{user.name}</div>
                    <div className="truncate text-[11px] leading-tight text-[color:var(--c-text-muted)]">{user.email}</div>
                </div>
                <span
                    aria-hidden
                    className={cx(
                        "grid h-7 shrink-0 place-items-center overflow-hidden rounded-md text-[color:var(--c-text-dim)] transition-[max-width,opacity] duration-500",
                        collapsed ? "pointer-events-none max-w-0 opacity-0" : "w-7 max-w-[28px] opacity-100",
                    )}
                >
                    <LogoutIcon />
                </span>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Topbar
// ════════════════════════════════════════════════════════════════════════════

/** Breadcrumb: `</>` chip + trail. On /projects the trail is just "Projects". */
export function TopbarCrumbs({ crumbs = ["Projects"], className, style }: PartProps & { crumbs?: string[] }) {
    return (
        <nav aria-label="Breadcrumb" className={cx("flex min-w-0 shrink items-center gap-1.5", className)} style={style}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-[color:var(--c-surface)] text-[color:var(--c-text-muted)] shadow-[0_1px_1px_rgba(17,24,39,0.03)] ring-1 ring-[color:var(--c-border)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
                </svg>
            </span>
            {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex min-w-0 items-center gap-1.5">
                    {i > 0 && (
                        <span className="text-[color:var(--c-text-dim)]" aria-hidden>
                            ›
                        </span>
                    )}
                    <span
                        className={
                            i === crumbs.length - 1
                                ? "max-w-[200px] truncate text-[12.5px] font-semibold text-[color:var(--c-text)]"
                                : "max-w-[140px] truncate text-[12.5px] font-medium text-[color:var(--c-text-muted)]"
                        }
                    >
                        {c}
                    </span>
                </span>
            ))}
        </nav>
    )
}

/** Search field (200 × 36, idle). */
export function TopbarSearch({ className, style }: PartProps) {
    return (
        <div className={cx("relative flex items-center", className)} style={style}>
            <span className="pointer-events-none absolute left-3 grid place-items-center text-[color:var(--c-text-dim)]">
                <SearchIcon />
            </span>
            <input
                type="search"
                readOnly
                tabIndex={-1}
                aria-label="Search"
                placeholder="Search…"
                className="ua-search pointer-events-none m-0 h-9 w-[200px] appearance-none rounded-[10px] border border-[color:var(--c-border)] bg-[color:var(--c-surface)] pl-9 pr-3 text-[13px] text-[color:var(--c-text)] shadow-[0_1px_1px_rgba(17,24,39,0.02)] outline-none placeholder:text-[color:var(--c-text-dim)]"
            />
        </div>
    )
}

/** Notification bell, closed (36 × 36 surface). `unread` shows the ember dot. */
export function TopbarBell({ unread = true, className, style }: PartProps & { unread?: boolean }) {
    return (
        <div className={cx("relative", className)} style={style}>
            <span aria-hidden className="block h-9 w-9" />
            <div
                className="absolute right-0 top-0 origin-top-right overflow-hidden rounded-[10px] border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-[0_1px_1px_rgba(17,24,39,0.04)]"
                style={{ width: 36, height: 36 }}
            >
                <div className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-[color:var(--c-text-muted)]">
                    <span className="grid place-items-center" style={{ transformOrigin: "50% 18%" }}>
                        <BellIcon />
                    </span>
                    {unread && <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-[color:var(--c-primary)] ring-2 ring-[color:var(--c-surface)]" />}
                </div>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Panel + page
// ════════════════════════════════════════════════════════════════════════════

/** The floating panel's surface only: white, 22px top-left, hairline + halo.
 *  Fills its box (defaults to 100% × 100%). Children are clipped separately. */
export function PanelSurface({ className, style }: PartProps) {
    return <div aria-hidden className={cx("app-panel", className)} style={{ width: "100%", height: "100%", ...style }} />
}

/** "Projects" h1 + subtitle. */
export function ProjectsTitle({ className, style }: PartProps) {
    return (
        <div className={cx("min-w-0", className)} style={style}>
            <h1 className="h-page">Projects</h1>
            <p className="m-0 mt-1 max-w-prose text-[13.5px] text-[color:var(--c-text-muted)]">
                One project per repository. Issues, integrations, and the analyser knowledge base hang off it.
            </p>
        </div>
    )
}

/** Ghost "New group" button. */
export function NewGroupButton({ className, style }: PartProps) {
    return (
        <div className={cx("btn-ghost", className)} style={style}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 7h7l1.5 2H21v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            </svg>
            New group
        </div>
    )
}

/** Ember "New project" button. */
export function NewProjectButton({ className, style }: PartProps) {
    return (
        <div className={cx("btn-primary", className)} style={style}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12h14" />
            </svg>
            New project
        </div>
    )
}

/** Page header row: title block left, buttons bottom-right (sm+ layout). */
export function ProjectsHeader({ className, style }: PartProps) {
    return (
        <header className={cx("flex flex-row items-end justify-between gap-4", className)} style={style}>
            <ProjectsTitle />
            <div className="flex flex-wrap items-center justify-end gap-2 self-auto">
                <NewGroupButton />
                <NewProjectButton />
            </div>
        </header>
    )
}

/** "GROUPS" section heading + subtitle. */
export function GroupsHeading({ className, style }: PartProps) {
    return (
        <div className={cx("flex items-end justify-between gap-3", className)} style={style}>
            <div className="min-w-0">
                <h2 className="h-section">Groups</h2>
                <p className="m-0 mt-0.5 text-[12px] text-[color:var(--c-text-muted)]">Bundle related projects so AI compose can route an issue to the best match.</p>
            </div>
        </div>
    )
}

/** One project-group chip: folder + name + member count. */
export function GroupChip({ name, count, className, style }: PartProps & { name: string; count: number }) {
    return (
        <div
            className={cx(
                "group inline-flex items-center gap-2 rounded-[12px] border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 py-2 text-[13px]",
                className,
            )}
            style={style}
        >
            <FolderIcon />
            <span className="font-semibold">{name}</span>
            <span className="rounded-full bg-[color:var(--c-surface-2)] px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-[color:var(--c-text-muted)]">{count}</span>
        </div>
    )
}

/** The whole Groups strip: heading, then the chip row (gap 8). */
export function GroupsStrip({ groups = DEMO_PROJECT_GROUPS, className, style }: PartProps & { groups?: { id: string; name: string; count: number }[] }) {
    return (
        <section className={cx("flex flex-col gap-2", className)} style={style}>
            <GroupsHeading />
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {groups.map((g) => (
                    <li key={g.id}>
                        <GroupChip name={g.name} count={g.count} />
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** Per-org heading: chevron, org colour dot, name, count, hairline spine. */
export function OrgHeader({ org, count, open = org.open, className, style }: PartProps & { org: DemoOrg; count: number; open?: boolean }) {
    return (
        <div className={cx("group flex w-full items-center gap-2 rounded-[8px] py-1 text-left", className)} style={style}>
            <OrgChevron open={open} />
            <span className="h-4 w-4 shrink-0 rounded-full ring-2" style={{ backgroundColor: org.chip.fg, ["--tw-ring-color" as string]: org.chip.bg } as CSSProperties} />
            <span className="min-w-0 truncate text-[13.5px] font-bold tracking-[-0.01em] text-[color:var(--c-text)]">{org.name}</span>
            <span className="rounded-full bg-[color:var(--c-surface-2)] px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-[color:var(--c-text-muted)]">{count}</span>
            <span aria-hidden className="ml-1 h-px flex-1 bg-[color:var(--c-border)]" />
        </div>
    )
}

function StatusFooter({ status }: { status: ProjectStatus }) {
    if (status.kind === "progress") {
        return (
            <span className="flex items-center gap-2.5">
                <span className="text-[15px] font-extrabold tabular-nums tracking-[-0.01em]">
                    {status.done}
                    <span className="text-[color:var(--c-text-dim)]"> / {status.total}</span>
                </span>
                <SegBar value={status.done} total={status.total} max={10} />
            </span>
        )
    }
    if (status.kind === "clear") {
        return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--c-text-muted)]">
                <CheckCircleIcon />
                No issues at all
            </span>
        )
    }
    if (status.kind === "critical") {
        return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--c-text-muted)]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--tw4-orange-500)]" />
                {status.count} critical {status.count > 1 ? "issues" : "issue"} open
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--c-text-muted)]">
            <PrIcon className="text-[color:var(--tw4-violet-500)]" />
            {status.count} PR{status.count > 1 ? "s" : ""} recently opened
        </span>
    )
}

/** Project tile (the org grid uses the `minimal` variant). h-full, so tiles in
 *  one grid row share the row height. */
export function ProjectTile({
    project,
    org = orgByKey(project.org),
    minimal = true,
    className,
    style,
}: PartProps & { project: DemoProject; org?: DemoOrg; minimal?: boolean }) {
    const { chip, people, name: orgName } = org
    const peopleLabel = people >= 20 ? "20+ People" : `${people} People`
    const desc = project.description
    return (
        <div
            className={cx(
                "block h-full rounded-sq-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]",
                className,
            )}
            style={style}
        >
            {/* Org header bar — chip tint, same per org. */}
            <div className="relative rounded-sq-t-xl pb-[30px] pt-2" style={{ backgroundColor: chip.bg, color: chip.fg }}>
                <div className="relative flex items-center justify-between gap-2 px-4">
                    <span className="min-w-0 truncate text-[16px] font-extrabold tracking-[-0.01em]">{orgName}</span>
                    <span className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center -space-x-1.5">
                            {Array.from({ length: Math.min(3, people) }).map((_, i) => (
                                <span key={i} className="h-4 w-4 rounded-full" style={{ backgroundColor: chip.fg, boxShadow: `0 0 0 2px ${chip.bg}` }} />
                            ))}
                        </span>
                        <span className="text-[12px] font-bold">{peopleLabel}</span>
                    </span>
                </div>
                <div className="absolute -bottom-14 z-10 h-20 w-full rounded-sq-xl bg-[color:var(--c-surface)]" />
                <div style={{ background: chip.bg }} className="absolute bottom-0 left-0 h-4 w-full" />
            </div>

            {/* Body */}
            <div className="relative z-20 -mt-5 flex flex-col gap-3 px-3.5 py-3">
                <div className={cx("flex gap-3", desc ? "items-start" : "items-center")}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: chip.bg, color: chip.fg }}>
                        <IconlyIcon name={project.icon} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="m-0 truncate text-[14px] font-bold leading-snug tracking-[-0.005em] text-[color:var(--c-text)]">{project.name}</h3>
                        {desc && <p className="m-0 mt-0.5 truncate text-[12.5px] leading-5 text-[color:var(--c-text-muted)]">{desc}</p>}
                    </div>
                </div>

                {!minimal && (
                    <FieldTable>
                        <FieldRow icon={<RepoMini />} label="Repo">
                            <span className="font-mono text-[11.5px]">{project.repo}</span>
                        </FieldRow>
                        <FieldRow icon={<ClockIcon />} label="Updated">
                            {project.updated}
                        </FieldRow>
                    </FieldTable>
                )}

                <div className="flex items-center justify-between gap-3">
                    <StatusFooter status={project.status} />
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[color:var(--c-text-dim)]">
                        <ClockIcon />
                        {project.ago}
                    </span>
                </div>
            </div>
        </div>
    )
}
