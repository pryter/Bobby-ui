"use client"

import type { CSSProperties, ReactNode, Ref } from "react"
import {
    ColHeader, MonthCell, WeekCell,
    CELL, GRID_LINE, HEADER_H, MONTH_ROW_H, NOW, PAST_PAD_DAYS, WEEK_ROW_H, WORKSPACE_HEADER_H,
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
const GRID_DOT = "rgba(17,24,39,0.05)" // = GRID_BG_IMAGE's dots

/** A part of the floor, in whole cells. */
export type FloorCells = { c0: number; c1: number; r0: number; r1: number }

const boxOf = (f: FloorCells) => ({ x: f.c0 * PB_CELL, y: f.r0 * PB_CELL, w: (f.c1 - f.c0) * PB_CELL, h: (f.r1 - f.r0) * PB_CELL })

/** The floor's box on the lattice. */
export const FLOOR_BOX = boxOf(FLOOR)

/** The lit area, in lattice px: a radial falloff around the plan (sides, far
 *  end) — opaque to 34%, half at 62%, gone at its edge — intersected with a
 *  fade before the floor's near edge. */
const LIT = {
    cx: PB_PLAN.x,
    cy: PB_PLAN.y,
    rx: 46 * PB_CELL,
    ry: 30 * PB_CELL,
    stops: [[0.34, 1], [0.62, 0.5], [1, 0]] as const,
    near: [(FLOOR.r1 - 7) * PB_CELL, (FLOOR.r1 - 1) * PB_CELL] as const,
}

/**
 * The lit area as a small image (`pxPerCell` px a cell) to lay over
 * FLOOR_BOX: `lit` is `color` in the lit shape (the intro's blank sheet, in
 * the floor's paper); `shade` is `color` everywhere the light isn't (the
 * floor's falloff, in the page's colour, over a floor drawn edge to edge —
 * the same picture as masking the floor over the page). Soft gradients
 * only, so it can be drawn small (FloorLight). Client only (canvas).
 */
export function floorLightImage(color: string, kind: "lit" | "shade", pxPerCell = 6): string {
    const q = pxPerCell / PB_CELL
    const W = Math.round(FLOOR_BOX.w * q)
    const H = Math.round(FLOOR_BOX.h * q)
    const make = () => {
        const c = document.createElement("canvas")
        c.width = W
        c.height = H
        return [c, c.getContext("2d")!] as const
    }
    // The light: opaque where lit, clear where not.
    const [light, ctx] = make()
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = "destination-in"
    // The radial falloff: a circle squashed to the ellipse.
    ctx.save()
    ctx.translate((LIT.cx - FLOOR_BOX.x) * q, (LIT.cy - FLOOR_BOX.y) * q)
    ctx.scale(1, LIT.ry / LIT.rx)
    const r = ctx.createRadialGradient(0, 0, 0, 0, 0, LIT.rx * q)
    r.addColorStop(0, "#000")
    for (const [at, a] of LIT.stops) r.addColorStop(at, `rgba(0,0,0,${a})`)
    ctx.fillStyle = r
    const far = (W + H) * (LIT.rx / LIT.ry) * 2
    ctx.fillRect(-far, -far, far * 2, far * 2)
    ctx.restore()
    // The near fade.
    const n = ctx.createLinearGradient(0, (LIT.near[0] - FLOOR_BOX.y) * q, 0, (LIT.near[1] - FLOOR_BOX.y) * q)
    n.addColorStop(0, "#000")
    n.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = n
    ctx.fillRect(0, 0, W, H)
    // The colour, kept where lit or where not.
    const [out, o] = make()
    o.fillStyle = color
    o.fillRect(0, 0, W, H)
    o.globalCompositeOperation = kind === "lit" ? "destination-in" : "destination-out"
    o.drawImage(light, 0, 0)
    return out.toDataURL("image/png")
}

// The floor is drawn in parts, each at its own resolution: inside a tilted 3D
// scene mobile Safari rasterises every layer whole, at the device's full
// resolution, however small it looks — so a layer costs its drawn area. Each
// part is laid out `scale` times its lattice size and shown in a plane whose
// camera makes up the difference (the timeline section's stage):
//   • FloorPaper — the paper and its grid, faint enough to draw at half size;
//   • FloorStrips — today's column and the date row, sharp (full size);
//   • FloorLight — a soft image: the falloff, or the intro's blank sheet.

/** The floor's background repeats every week — lines every cell, the
 *  weekend pair every 7, the paper's dots every half cell — so a pan of any
 *  length can be played as a shift of under a week that wraps. */
export const FLOOR_PERIOD = 7 * PB_CELL
const DOT = PB_CELL / 2

/**
 * The panel's paper carried on in every direction: cell lines (repeating
 * gradients, aligned with the panel's lattice), weekend shading and the
 * paper's dots, inside a fixed window at `cells` (what a camera can see; it
 * clips). The paper (`gridRef`) is one week wider than the window: a pan
 * only ever needs to shift it by under a week (FLOOR_PERIOD) and jump back,
 * which looks the same as sliding on for ever and never needs new pixels.
 */
export function FloorPaper({ cells = FLOOR, scale = 1, gridRef }: { cells?: FloorCells; scale?: number; gridRef?: Ref<HTMLDivElement> }) {
    const cell = PB_CELL
    const { x: x0, y: y0, w, h } = boxOf(cells)
    const z = (v: number) => v * scale
    // Background tiles anchored to the lattice: lines on whole cells, the
    // weekend pair starting on a Saturday, and the paper's dots where the
    // panel's paper starts (its board area's top-left).
    const satX = mod(PB_TODAY_COL * cell - x0 - (((new Date(NOW).getUTCDay() + 1) % 7) * cell), 7 * cell)
    const dots = { x: mod(PB_FRAME.x - x0, DOT), y: mod(PB_FRAME.y + WORKSPACE_HEADER_H - y0, DOT) }
    const lines = `linear-gradient(to right, ${GRID_LINE} ${z(1)}px, transparent ${z(1)}px), linear-gradient(to bottom, ${GRID_LINE} ${z(1)}px, transparent ${z(1)}px)`
    const weekend = `linear-gradient(to right, ${WEEKEND_SHADE} ${z(2 * cell)}px, transparent ${z(2 * cell)}px)`
    const dot = `radial-gradient(circle at ${z(1)}px ${z(1)}px, ${GRID_DOT} ${z(1.4)}px, transparent 0)`
    return (
        <div className="ucelot-app pointer-events-none absolute select-none overflow-hidden" style={{ left: z(x0), top: z(y0), width: z(w), height: z(h) }}>
            <div
                ref={gridRef}
                className="absolute left-0 top-0"
                style={{
                    width: z(w + FLOOR_PERIOD),
                    height: z(h),
                    backgroundColor: "var(--c-shell)",
                    backgroundImage: `${lines}, ${weekend}, ${dot}`,
                    backgroundSize: `${z(cell)}px ${z(cell)}px, ${z(cell)}px ${z(cell)}px, ${z(7 * cell)}px 100%, ${z(DOT)}px ${z(DOT)}px`,
                    backgroundPosition: `0 0, 0 0, ${z(satX)}px 0, ${z(dots.x)}px ${z(dots.y)}px`,
                }}
            />
        </div>
    )
}

/**
 * Today's column running into the distance and the date row (one lane clear
 * above lane 0, DATE_GAP, from DATE_ROW.c0 to c1), in the same window as the
 * paper, at full size. Both pan all the way (`todayRef`, `datesRef`).
 */
export function FloorStrips({
    cells = FLOOR, wrapToday, todayRef, datesRef,
}: {
    cells?: FloorCells
    wrapToday?: (pill: ReactNode) => ReactNode
    todayRef?: Ref<HTMLDivElement>
    datesRef?: Ref<HTMLDivElement>
}) {
    const cell = PB_CELL
    const { x: x0, y: y0, w, h } = boxOf(cells)
    const strip = { left: DATE_ROW.c0 * cell - x0, top: -(HEADER_H + 1) - DATE_GAP - y0, width: (DATE_ROW.c1 - DATE_ROW.c0 + 1) * cell }
    return (
        <div className="ucelot-app pointer-events-none absolute select-none overflow-hidden" style={{ left: x0, top: y0, width: w, height: h }}>
            <div ref={todayRef} className="absolute top-0" style={{ left: PB_TODAY_COL * cell - x0, width: cell, height: h, background: mix("--c-primary", 9) }} />
            <div
                ref={datesRef}
                className="absolute overflow-hidden border-b border-[color:var(--c-border)]"
                style={{ ...strip, height: HEADER_H + 1, background: mix("--c-surface", 85) }}
            >
                {/* Offset with `left`, not a transform: inside the 3D scene a
                    transform would make this 8,000 px strip a layer of its own. */}
                <div className="relative" style={{ height: HEADER_H, left: -DATE_ROW.c0 * cell }}>
                    <DateTiers c0={DATE_ROW.c0} c1={DATE_ROW.c1} wrapToday={wrapToday} />
                </div>
            </div>
        </div>
    )
}

/** A floorLightImage laid over FLOOR_BOX, `scale` times its size. */
export function FloorLight({ src, scale = 1, imgRef, style }: { src: string; scale?: number; imgRef?: Ref<HTMLImageElement>; style?: CSSProperties }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            ref={imgRef}
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ left: FLOOR_BOX.x * scale, top: FLOOR_BOX.y * scale, width: FLOOR_BOX.w * scale, height: FLOOR_BOX.h * scale, ...style }}
        />
    )
}
