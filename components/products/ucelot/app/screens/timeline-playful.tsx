"use client"

import type { ReactNode } from "react"
import { motion, type MotionStyle } from "framer-motion"
import {
    ColHeader, MonthCell, WeekCell,
    CELL, GRID_BG_IMAGE, GRID_LINE, HEADER_H, MONTH_ROW_H, NOW, PAST_PAD_DAYS, WEEK_ROW_H, WORKSPACE_HEADER_H,
    addDays, brickBox, groupColumns, mix, monthKey, tileCols, weekStartMs,
    type DemoIssue,
} from "./timeline"

// ─── Ucelot playful timeline — the example board, static ──────────────────────
// bobby-tracker's dev preview of the sticker-board planner, frozen:
//   app/preview/timeline-playful/page.tsx (LABELS → Iconly icons, SCHEDULED
//   specs, TRAY backlog, packLanes; day 0 = today) rendered the way
//   components/timeline/timeline-grid-playful.tsx draws it on open.
//
// Pieces (tiles, header tiers, tray, palette) come from the exact port in
// ./timeline. "Today" is pinned to Sat Oct 31 2026 so server and client agree.
// The board's opening camera — pan.x = 0, so the origin (today − 3 days) sits
// at the left edge and row 0 right under the pinned header — zoomed in two
// steps (+, + → 144 %) so tiles read at marketing size.
//
// Everything is placed on ONE lattice ("lattice px": col × cell, row × cell,
// origin at day 0 / lane 0, the date tiers above it at negative y), so the
// pieces can be laid out on a single 3D plane by the caller:
//   • PlayfulFloor — the grid, paper, weekend shading, today's column and
//     date row carried on far in every direction — the endless floor;
//   • PB_TILES — the 20 scheduled tiles with their boxes on the lattice.


// ════════════════════════════════════════════════════════════════════════════
// Demo data (verbatim from the preview)
// ════════════════════════════════════════════════════════════════════════════

type IssueStatus = "open" | "in_progress" | "blocked" | "done" | "archived" | "duplicated"
type IssuePriority = "low" | "medium" | "high" | "urgent"

// A tiny inline-SVG thumbnail as a data URI, so image tiles render offline.
function shot(bg: string, fg: string): string {
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='84'>` +
        `<rect width='120' height='84' fill='${bg}'/>` +
        `<circle cx='34' cy='30' r='15' fill='${fg}' opacity='0.9'/>` +
        `<rect x='16' y='54' width='88' height='9' rx='4.5' fill='${fg}' opacity='0.55'/>` +
        `<rect x='16' y='69' width='56' height='7' rx='3.5' fill='${fg}' opacity='0.32'/>` +
        `</svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// A scheduled issue before it's been assigned a lane. `days` is its width in
// columns, `span` its height in lanes (2+ shows a description, 3 thumbnails).
interface Spec {
    title: string
    status: IssueStatus
    priority: IssuePriority
    label: string
    startDay: number
    days: number
    span?: number
    body?: string
}

const SCHEDULED_SPECS: Spec[] = [
    {
        title: "Design LEGO baseplate", label: "design", status: "in_progress", priority: "high",
        startDay: 0, days: 4, span: 3,
        body:
            "Square baseplate where columns are days and rows are lanes. Bricks snap to whole cells and never overlap. " +
            `![grid](${shot("#0f172a", "#38bdf8")}) ![lanes](${shot("#1e293b", "#a78bfa")}) ![studs](${shot("#312e81", "#f0abfc")})`,
    },
    { title: "Fix drag jitter on Safari", label: "bug", status: "open", priority: "urgent", startDay: 0, days: 1 },
    { title: "Snap resize to whole days", label: "frontend", status: "open", priority: "medium", startDay: 1, days: 2 },
    { title: "Outbox flush retry policy", label: "backend", status: "in_progress", priority: "high", startDay: 2, days: 3 },
    { title: "Rate-limit the schedule API", label: "api", status: "blocked", priority: "high", startDay: 3, days: 2 },
    { title: "SSO / passkey login", label: "auth", status: "open", priority: "medium", startDay: 4, days: 3 },
    {
        title: "AI issue summariser", label: "ai", status: "in_progress", priority: "high",
        startDay: 5, days: 3, span: 2,
        body: "Summarise long issue threads into a two-line brief and suggest the next action. Runs on Workers AI with a fallback model.",
    },
    { title: "Write timeline docs", label: "docs", status: "done", priority: "low", startDay: 6, days: 1 },
    { title: "Stripe usage billing", label: "billing", status: "open", priority: "medium", startDay: 8, days: 3 },
    { title: "Terraform the edge stack", label: "infra", status: "blocked", priority: "urgent", startDay: 9, days: 2 },
    { title: "iOS push notifications", label: "mobile", status: "in_progress", priority: "high", startDay: 11, days: 4 },
    { title: "Funnel analytics board", label: "analytics", status: "open", priority: "medium", startDay: 13, days: 2 },
    { title: "Realtime chat presence", label: "chat", status: "open", priority: "low", startDay: 14, days: 3 },
    { title: "Refund webhook handler", label: "payments", status: "done", priority: "medium", startDay: 16, days: 2 },
    {
        title: "Vectorise issue embeddings", label: "data", status: "in_progress", priority: "high",
        startDay: 17, days: 5, span: 2,
        body:
            "Backfill embeddings for every issue so similar-report detection works at scale. Batched through the queue. " +
            `![vectors](${shot("#052e2b", "#2dd4bf")}) ![index](${shot("#1e1b4b", "#818cf8")})`,
    },
    { title: "Sprint calendar sync", label: "calendar", status: "open", priority: "low", startDay: 19, days: 2 },
    { title: "Legacy import cleanup", label: "frontend", status: "archived", priority: "low", startDay: 22, days: 3 },
    { title: "Dedup duplicate reports", label: "backend", status: "duplicated", priority: "medium", startDay: 25, days: 2 },
    { title: "Crash on empty board", label: "bug", status: "open", priority: "urgent", startDay: 27, days: 3 },
    { title: "Polish empty states", label: "design", status: "done", priority: "low", startDay: 29, days: 2 },
]

const LANES = 11 // reference lane count for the packer

// Greedily assign each scheduled spec the lowest free lane whose
// [startDay, startDay+width) × [lane, lane+span) region is unoccupied, reserving
// the footprint the board renders (tileCols), so nothing overlaps.
function packLanes(specs: Spec[]): (Spec & { lane: number })[] {
    const occ = new Set<string>()
    return specs.map((s) => {
        const span = s.span ?? 1
        const width = tileCols(s.days)
        let lane = 0
        for (; lane + span <= LANES; lane++) {
            let free = true
            for (let dc = 0; dc < width && free; dc++)
                for (let dl = 0; dl < span && free; dl++)
                    if (occ.has(`${lane + dl}:${s.startDay + dc}`)) free = false
            if (free) break
        }
        if (lane + span > LANES) lane = 0
        for (let dc = 0; dc < width; dc++)
            for (let dl = 0; dl < span; dl++)
                occ.add(`${lane + dl}:${s.startDay + dc}`)
        return { ...s, lane }
    })
}

// mk(): ids mock-1… in creation order (scheduled first, then the tray), issue
// numbers from #101. The sticker colour hashes from the id, as on the board.
export type PlayfulIssue = DemoIssue & { status: IssueStatus; priority: IssuePriority; startDay: number; days: number }

// The work further out — what keeps landing as the timeline drifts on into the
// future (TimelineSection's exit). Same spec shape and rules as the preview's:
// the preview's six backlog titles get scheduled, plus more Storefront work,
// numbered on from #121.
const FUTURE_SPECS: Spec[] = [
    { title: "Dark mode audit", label: "design", status: "open", priority: "medium", startDay: 32, days: 2 },
    {
        title: "Gift card redemption", label: "payments", status: "open", priority: "high", startDay: 33, days: 4, span: 2,
        body: "Let shoppers redeem gift cards at checkout and see the balance left. Partial redemptions split across payment methods.",
    },
    { title: "Keyboard shortcuts", label: "frontend", status: "open", priority: "low", startDay: 35, days: 2 },
    { title: "Holiday sale banner", label: "design", status: "open", priority: "medium", startDay: 38, days: 3 },
    { title: "Saved carts sync", label: "backend", status: "open", priority: "medium", startDay: 39, days: 4 },
    { title: "Audit log export", label: "backend", status: "open", priority: "high", startDay: 42, days: 2 },
    {
        title: "Tax rules for EU", label: "billing", status: "open", priority: "high", startDay: 45, days: 5, span: 2,
        body: "Charge VAT by the shopper's country with OSS reporting. Prices shown tax-inclusive where the law says so.",
    },
    { title: "Inventory alerts", label: "data", status: "open", priority: "medium", startDay: 46, days: 3 },
    { title: "Webhook signing", label: "api", status: "open", priority: "high", startDay: 49, days: 2 },
    {
        title: "Search relevance tuning", label: "ai", status: "open", priority: "medium", startDay: 52, days: 4, span: 2,
        body: "Re-rank results with click-through data and synonyms, so the right product is on the first row.",
    },
    { title: "Onboarding checklist", label: "docs", status: "open", priority: "medium", startDay: 53, days: 2 },
    { title: "Order export CSV", label: "data", status: "open", priority: "low", startDay: 57, days: 3 },
    { title: "Accessibility pass", label: "frontend", status: "open", priority: "high", startDay: 60, days: 4 },
    {
        title: "Returns portal", label: "mobile", status: "open", priority: "medium", startDay: 63, days: 5, span: 2,
        body: "Self-serve returns: pick items, print a label, track the refund. Exchanges suggest the right size.",
    },
    { title: "Locale / i18n pass", label: "frontend", status: "open", priority: "low", startDay: 66, days: 3 },
    { title: "Image CDN migration", label: "infra", status: "open", priority: "medium", startDay: 68, days: 4 },
    { title: "A/B pricing test", label: "analytics", status: "open", priority: "medium", startDay: 72, days: 3 },
    { title: "Wishlist sharing", label: "mobile", status: "open", priority: "low", startDay: 75, days: 3 },
    { title: "Checkout perf budget", label: "frontend", status: "open", priority: "high", startDay: 78, days: 2 },
    {
        title: "Loyalty points", label: "payments", status: "open", priority: "medium", startDay: 81, days: 4, span: 2,
        body: "Earn points on every order and spend them at checkout. Tiers unlock free shipping and early access.",
    },
    { title: "Fraud score alerts", label: "auth", status: "open", priority: "urgent", startDay: 85, days: 2 },
    { title: "Store locator", label: "mobile", status: "open", priority: "low", startDay: 88, days: 3 },
    { title: "Subscription boxes", label: "billing", status: "open", priority: "medium", startDay: 92, days: 4 },
    { title: "Product reviews", label: "chat", status: "open", priority: "medium", startDay: 96, days: 3 },
    { title: "Bulk price editor", label: "backend", status: "open", priority: "low", startDay: 100, days: 2 },
    { title: "Shipping rate cards", label: "api", status: "open", priority: "medium", startDay: 104, days: 3 },
    { title: "Spring catalogue launch", label: "calendar", status: "open", priority: "high", startDay: 108, days: 3 },
    { title: "Gift wrap options", label: "design", status: "open", priority: "low", startDay: 112, days: 3 },
    { title: "Partner API keys", label: "api", status: "open", priority: "medium", startDay: 115, days: 2 },
    {
        title: "Warehouse sync v2", label: "infra", status: "open", priority: "high", startDay: 118, days: 4, span: 2,
        body: "Stream stock levels from every warehouse in near real time, so the storefront never sells what isn't there.",
    },
    { title: "Easter campaign", label: "calendar", status: "open", priority: "medium", startDay: 122, days: 3 },
    { title: "Churn dashboard", label: "analytics", status: "open", priority: "medium", startDay: 126, days: 3 },
    { title: "SMS order updates", label: "mobile", status: "open", priority: "low", startDay: 130, days: 2 },
    { title: "Price-drop alerts", label: "ai", status: "open", priority: "medium", startDay: 133, days: 3 },
]

const toIssue = (s: Spec & { lane: number }, n: number): PlayfulIssue => ({
    id: `mock-${n - 100}`,
    number: n,
    title: s.title,
    labels: [s.label],
    status: s.status,
    priority: s.priority,
    start: addDays(NOW, s.startDay),
    end: addDays(NOW, s.startDay + s.days - 1), // inclusive last day
    row: s.lane,
    span: s.span ?? 1,
    body: s.body ?? "",
    startDay: s.startDay,
    days: s.days,
})

// One packing pass over everything, so the future work never overlaps the plan
// (the plan packs exactly as before: it goes first).
const PACKED = packLanes([...SCHEDULED_SPECS, ...FUTURE_SPECS])
const ALL_SCHEDULED: PlayfulIssue[] = PACKED.slice(0, SCHEDULED_SPECS.length).map((s, i) => toIssue(s, 101 + i))
const FUTURE: PlayfulIssue[] = PACKED.slice(SCHEDULED_SPECS.length).map((s, j) => toIssue(s, 101 + SCHEDULED_SPECS.length + j)) // #121…

// ════════════════════════════════════════════════════════════════════════════
// Geometry
// ════════════════════════════════════════════════════════════════════════════

export const PB_ZOOM = 1.4375 // ≈ two "+" steps; the readout says 144 %
export const PB_CELL = CELL * PB_ZOOM // 46 — a whole pixel, so repeating gradients and DOM lines agree
/** boardOrigin(): midnight of the earliest start (today) minus PAST_PAD_DAYS. */
export const PB_ORIGIN = addDays(Math.min(NOW, ...ALL_SCHEDULED.map((i) => i.start!)), -PAST_PAD_DAYS) // Wed Oct 28
export const PB_TODAY_COL = Math.round((NOW - PB_ORIGIN) / (24 * 60 * 60 * 1000)) // 3
/** The framed panel shows Wed Oct 28 → Sun Nov 22 (the rest of week 44, then 45–47). */
export const PB_DAYS = 26
/** Lanes of panel below the header (the tray floats over the last two). */
export const PB_LANES = 9.5

const PAN = { x: 0, y: HEADER_H + 1 } // row 0 right under the pinned header (+ its border-b)
const PANEL_BOARD_W = PB_DAYS * PB_CELL // 1196
const PANEL_BOARD_H = PAN.y + PB_LANES * PB_CELL // 534
export const PB_FRAME_W = PANEL_BOARD_W
export const PB_FRAME_H = WORKSPACE_HEADER_H + PANEL_BOARD_H // ≈ 597.25
/** The panel's box on the lattice. */
export const PB_FRAME = { x: -PAN.x, y: -(WORKSPACE_HEADER_H + PAN.y), w: PB_FRAME_W, h: PB_FRAME_H }

/** The floor, in cells (lattice cols × rows); the date row runs DATE_ROW wide. */
export const FLOOR = { c0: -30, c1: 66, r0: -28, r1: 16 } // ≈ 4400 × 2000 px; its mask is clear past this
export const DATE_ROW = { c0: -10, c1: 180 } // ~190 days: today − 13 … + 177, enough for the exit's pan
/** How far right the floor's surface runs past its (fixed) lit window, in cells,
 *  so a pan of up to ~115 cells still shows fresh floor coming in from the right. */
export const FLOOR_SURFACE_C1 = 186
/** Clear floor between the date row and lane 0 on the endless floor (one lane). */
export const DATE_GAP = PB_CELL
/** Where the plan sits: days −3…+32, lanes 0…7 (centre, lattice px). */
export const PB_PLAN = { x: 18 * PB_CELL, y: 3 * PB_CELL }

/** A scheduled tile with its box on the lattice. */
export type PlacedTile = { issue: PlayfulIssue } & ReturnType<typeof brickBox>

/** All 20 scheduled tiles of the preview. */
export const PB_TILES: PlacedTile[] = ALL_SCHEDULED.map((issue) => ({ issue, ...brickBox(issue, PB_CELL, PB_ORIGIN) }))
/** The future work (days 32…135), placed the same way. */
export const PB_FUTURE: PlacedTile[] = FUTURE.map((issue) => ({ issue, ...brickBox(issue, PB_CELL, PB_ORIGIN) }))

// ════════════════════════════════════════════════════════════════════════════
// Date tiers
// ════════════════════════════════════════════════════════════════════════════

/** Month / week / day tiers for cols c0…c1, on the lattice (left = col × cell). */
function DateTiers({ c0, c1, wrapToday }: { c0: number; c1: number; wrapToday?: (pill: ReactNode) => ReactNode }) {
    const cell = PB_CELL
    return (
        <>
            {groupColumns(c0, c1, monthKey, PB_ORIGIN).map((g) => (
                <MonthCell key={`m${g.firstCol}`} g={g} cell={cell} />
            ))}
            {groupColumns(c0, c1, weekStartMs, PB_ORIGIN).map((g) => (
                <WeekCell key={`w${g.firstCol}`} g={g} cell={cell} current={weekStartMs(g.ms) === weekStartMs(NOW)} />
            ))}
            {Array.from({ length: Math.max(0, c1 - c0 + 1) }, (_, i) => {
                const c = c0 + i
                const ms = addDays(PB_ORIGIN, c)
                return (
                    <ColHeader
                        key={c}
                        dateMs={ms}
                        isToday={c === PB_TODAY_COL}
                        weekStart={new Date(ms).getUTCDay() === 1}
                        left={c * cell}
                        top={MONTH_ROW_H + WEEK_ROW_H}
                        cell={cell}
                        wrapToday={wrapToday}
                    />
                )
            })}
        </>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// The endless floor
// ════════════════════════════════════════════════════════════════════════════

const mod = (a: number, n: number) => ((a % n) + n) % n
const WEEKEND_SHADE = "rgba(17,24,39,0.022)"

/** The floor's box on the lattice. */
export const FLOOR_BOX = {
    x: FLOOR.c0 * PB_CELL,
    y: FLOOR.r0 * PB_CELL,
    w: (FLOOR.c1 - FLOOR.c0) * PB_CELL,
    h: (FLOOR.r1 - FLOOR.r0) * PB_CELL,
}

/**
 * The panel's grid carried on in every direction: paper, cell lines (repeating
 * gradients, aligned with the panel's lattice to the pixel), weekend shading,
 * today's column running into the distance and the date row, one lane clear
 * above lane 0 (DATE_GAP), from DATE_ROW.c0 to c1.
 *
 * Two layers: a fixed WINDOW at FLOOR_BOX carrying the static mask — a lit area
 * around the plan falling off into the dark, so there is no visible edge — and
 * inside it the SURFACE, which runs on far to the right (FLOOR_SURFACE_C1) and
 * can be panned (`surfaceStyle`, e.g. a motion `x`) while the lit area stays
 * put: an endless timeline sliding by. Holds no 3D children.
 */
export function PlayfulFloor({ wrapToday, surfaceStyle }: { wrapToday?: (pill: ReactNode) => ReactNode; surfaceStyle?: MotionStyle }) {
    const cell = PB_CELL
    const { x: x0, y: y0, w, h } = FLOOR_BOX
    const surfaceW = (FLOOR_SURFACE_C1 - FLOOR.c0) * cell
    // Background tiles anchored to the lattice: lines on whole cells, the
    // weekend pair starting on a Saturday, and the paper's dots where the
    // panel's paper starts (its board area's top-left).
    const satX = mod(PB_TODAY_COL * cell - x0 - (((new Date(NOW).getUTCDay() + 1) % 7) * cell), 7 * cell)
    const dots = { x: mod(PB_FRAME.x - x0, 22), y: mod(PB_FRAME.y + WORKSPACE_HEADER_H - y0, 22) }
    const lines = `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`
    const weekend = `linear-gradient(to right, ${WEEKEND_SHADE} ${2 * cell}px, transparent ${2 * cell}px)`
    // A lit area around the plan falling off into the dark: a radial falloff
    // (sides, far end), intersected with a fade before the near edge.
    const lit = { x: PB_PLAN.x - x0, y: PB_PLAN.y - y0 }
    const mask =
        `radial-gradient(ellipse ${46 * cell}px ${30 * cell}px at ${lit.x}px ${lit.y}px, #000 34%, rgba(0,0,0,0.5) 62%, transparent 100%), ` +
        `linear-gradient(to bottom, #000 ${h - 7 * cell}px, transparent ${h - cell}px)`
    const strip = { left: DATE_ROW.c0 * cell - x0, top: -(HEADER_H + 1) - DATE_GAP - y0, width: (DATE_ROW.c1 - DATE_ROW.c0 + 1) * cell }

    return (
        <div
            className="ucelot-app pointer-events-none absolute select-none"
            style={{
                left: x0,
                top: y0,
                width: w,
                height: h,
                maskImage: mask,
                WebkitMaskImage: mask,
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
            }}
        >
            <motion.div
                className="absolute left-0 top-0"
                style={{
                    width: surfaceW,
                    height: h,
                    backgroundColor: "var(--c-shell)",
                    backgroundImage: `${lines}, ${weekend}, ${GRID_BG_IMAGE}`,
                    backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px, ${7 * cell}px 100%, 22px 22px`,
                    backgroundPosition: `0 0, 0 0, ${satX}px 0, ${dots.x}px ${dots.y}px`,
                    ...surfaceStyle,
                }}
            >
                {/* Today's column, into the distance. */}
                <div className="absolute top-0" style={{ left: PB_TODAY_COL * cell - x0, width: cell, height: h, background: mix("--c-primary", 9) }} />
                {/* The date row, painted on the plane above lane 0. */}
                <div
                    className="absolute overflow-hidden border-b border-[color:var(--c-border)]"
                    style={{ ...strip, height: HEADER_H + 1, background: mix("--c-surface", 85) }}
                >
                    <div className="relative" style={{ height: HEADER_H, transform: `translateX(${-DATE_ROW.c0 * cell}px)` }}>
                        <DateTiers c0={DATE_ROW.c0} c1={DATE_ROW.c1} wrapToday={wrapToday} />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
