"use client"

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion, useMotionTemplate, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion"
import {
  DEMO_ACCESS_GROUPS,
  DEMO_FEATURED,
  DEMO_ORGS,
  GroupsStrip,
  LAYOUT,
  OrgHeader,
  PanelSurface,
  ProjectTile,
  ProjectsTitle,
  NewGroupButton,
  NewProjectButton,
  SIDEBAR_EASE,
  SIDEBAR_NAV,
  SidebarBalance,
  SidebarBrand,
  SidebarBloom,
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
  projectsForOrg,
} from "./app/parts"

// ─── The assembling board ─────────────────────────────────────────────────────
// The real Projects screen (ported in ./app/parts), split into the pieces that
// animate in. The scenes that use it (Assembly, AssemblyCinematic) decide WHEN
// each piece arrives — from its region, reading order and position on the
// board — and HOW: flying in from the left, or laying down onto a flat board.
//
// Every piece is laid out in normal flow; only its transform and opacity move,
// so the finished frame is pixel-identical to the flat UI. For the depth to
// survive, every container between the stage and a piece must keep
// `transform-style: preserve-3d` and must not clip (overflow), fade (opacity)
// or filter — any of those flattens the 3D context.

// 1200 wide, and tall enough that the Acme and Northwind tiles fit without
// clipping (clipping would flatten the 3D, so the board grows to its content).
export const W = LAYOUT.screen.width
export const H = 912 // the app area
export const FRAME_H = 40 // window title bar above it
export const BOARD_H = H + FRAME_H // the whole window — what the scenes size and frame
export const P3 = "[transform-style:preserve-3d]"

export type Region = "panel" | "decor" | "topbar" | "sidebar" | "page"
// `order` is the reading order within the region; `y` the piece's top edge on
// the board, so a camera travelling down the board can reveal pieces as it goes.
// `decor` is the sidebar's ember glow (order 0, top-left) and pixel texture
// (order 1, bottom-left): they don't arrive like pieces, they spread out from
// their corner, flat on the board.
export type PieceMeta = { region: Region; order: number; y: number }

export type BoardMotion = {
  p: MotionValue<number>
  schedule: (m: PieceMeta) => { at: number; dur: number }
  arrival: "fly" | "lay"
  flatStart: number // layers start pressing flat…
  flatEnd: number   // …and are flush with the board by here
  // Optional: from this progress on, the sidebar collapses to the icon rail —
  // the app's real collapse, played in real time with its own transitions
  // (not scrubbed), and reversed if you scroll back.
  collapseAt?: number
}

const BoardCtx = createContext<BoardMotion | null>(null)
const CollapseCtx = createContext(false)

// Thickness for card-like pieces: a few stacked layers in the element's own
// shape (same radius / squircle class) just under it, so at a low camera angle
// you see a solid edge — a physical tile sitting on the board, not a sticker.
type Slab = { shape: string; color?: string }
const SLAB_THICKNESS = 5
const SLAB_LAYERS = 4

function SlabLayers({ shape, color = "#d4cec5" }: Slab) {
  return (
    <>
      {Array.from({ length: SLAB_LAYERS }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className={"pointer-events-none absolute inset-0 " + shape}
          style={{ background: color, transform: `translateZ(${-((i + 1) * SLAB_THICKNESS) / SLAB_LAYERS}px)` }}
        />
      ))}
    </>
  )
}

// `flip` marks a piece that the sidebar collapse moves (see Board): "move"
// slides it, "box" slides and resizes it. The collapse is pre-rendered — the
// new layout is applied at once and these pieces animate from where they were
// with transforms only, on an inner wrapper so they don't fight the piece's own
// scroll-driven transform.
type Flip = "move" | "box"

function Piece({
  meta, depth = 0, slab, flip, className = "", style, children,
}: {
  meta: PieceMeta
  depth?: number
  slab?: Slab
  flip?: Flip
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const { p, schedule, arrival, flatStart, flatEnd } = useContext(BoardCtx)!
  const { at, dur } = schedule(meta)
  // fly: in from the left and slightly toward you. lay: straight down onto
  // the board from above, settling with a touch of scale.
  const fly = arrival === "fly"
  const x = useTransform(p, [at, at + dur], fly ? [-640, 0] : [0, 0])
  // lay: lifting a piece toward the camera projects it UP the screen, over the
  // rows already placed above it. Starting it a little further down the board
  // cancels that out, so it settles into its slot without covering a seated
  // row (pieces are placed top to bottom, so the space below is still empty).
  const y = useTransform(p, [at, at + dur], fly ? [0, 0] : [44, 0])
  // "lay" drops from low and seats flush on the board: on a steeply tilted,
  // close-up board any height off the surface projects up the screen over the
  // rows above, so landed pieces keep only a hair of depth (enough to avoid
  // z-fighting with the board).
  // A piece with a slab rests at its own thickness, so the edge fills the gap
  // down to what it sits on. Page pieces sit on the panel, which has its own
  // thickness, so they start from the panel's surface rather than the board.
  const base = meta.region === "page" ? SLAB_THICKNESS : 0
  const rest = base + Math.max(fly ? depth : depth * 0.06, slab ? SLAB_THICKNESS : 0)
  const z = useTransform(p, [at, at + dur, flatStart, flatEnd], [fly ? 180 : base + 52, rest, rest, 0])
  const scale = useTransform(p, [at, at + dur], fly ? [1, 1] : [1.04, 1])
  const opacity = useTransform(p, [at, at + dur * 0.7], [0, 1])
  return (
    <motion.div
      style={{ ...style, x, y, z, scale, opacity }}
      className={slab ? `${className.includes("absolute") ? "" : "relative "}${P3} ${className}` : className}
    >
      {flip ? (
        <div
          data-flip={flip}
          // FLIP scales from the top-left corner (the delta is measured there)
          className={"origin-top-left " + (className.includes("absolute") ? "absolute inset-0 " : "relative ") + (slab ? P3 : "")}
        >
          {slab && <SlabLayers {...slab} />}
          {children}
        </div>
      ) : (
        <>
          {slab && <SlabLayers {...slab} />}
          {children}
        </>
      )}
    </motion.div>
  )
}

const SB = LAYOUT.sidebar
const TB = LAYOUT.topbar
const PANEL = LAYOUT.panel
const PAGE = LAYOUT.page
const GRID = LAYOUT.orgGrid

// The ember glow grows out of the sidebar's top-left corner (scale + fade, so
// its soft edge stays soft); the pixel texture is revealed by a circle
// spreading from the bottom-left corner, so the cells appear outward from it.
// Both stay flat in the board's plane. The glow is clipped to the window, not
// the rail (in the app it's position: fixed, so collapsing the sidebar doesn't
// cut it); the texture stays clipped to the rail and narrows with it.
function GlowSpread() {
  const { p, schedule } = useContext(BoardCtx)!
  const { at, dur } = schedule({ region: "decor", order: 0, y: 0 })
  const scale = useTransform(p, [at, at + dur], [0.15, 1])
  const opacity = useTransform(p, [at, at + dur * 0.6], [0, 1])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale, opacity, transformOrigin: "0% 0%" }}>
        <SidebarBloom />
      </motion.div>
    </div>
  )
}

function ScatterSpread() {
  const { p, schedule } = useContext(BoardCtx)!
  const { at, dur } = schedule({ region: "decor", order: 1, y: H - 224 })
  const r = useTransform(p, [at, at + dur], [0, 150])
  const clipPath = useMotionTemplate`circle(${r}% at 0% 100%)`
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath, WebkitClipPath: clipPath }}>
      <SidebarEmberScatter />
    </motion.div>
  )
}

// Collapsed geometry and transitions, straight from the app (see LAYOUT).
const COLLAPSED = SB.collapsed

function TopbarPieces() {
  const collapsed = useContext(CollapseCtx)
  return (
    <div
      className={"absolute flex items-center " + P3}
      style={{
        left: collapsed ? COLLAPSED.shell.x : TB.x,
        width: collapsed ? COLLAPSED.shell.width : TB.width,
        top: TB.y, height: TB.height, paddingLeft: TB.padX, paddingRight: TB.padX, gap: TB.gap,
      }}
    >
      <Piece meta={{ region: "topbar", order: 0, y: TB.y }} depth={14} flip="move"><TopbarCrumbs /></Piece>
      <div className={"ml-auto flex shrink-0 items-center " + P3} style={{ gap: TB.actionsGap }}>
        <Piece meta={{ region: "topbar", order: 1, y: TB.y }} depth={14} slab={{ shape: "rounded-[10px]" }} flip="move"><TopbarSearch /></Piece>
        <Piece meta={{ region: "topbar", order: 2, y: TB.y }} depth={14} slab={{ shape: "rounded-[10px]" }} flip="move"><TopbarBell /></Piece>
      </div>
    </div>
  )
}

function SidebarPieces() {
  const collapsed = useContext(CollapseCtx)
  const c = collapsed
  const R = SB.rowsY
  let order = 0
  const m = (y: number): PieceMeta => ({ region: "sidebar", order: order++, y })
  return (
    <div
      className={"absolute " + P3}
      style={{ left: SB.x, top: SB.y, width: c ? COLLAPSED.width : SB.width, height: H, transition: COLLAPSED.transition.width }}
    >
      <ScatterSpread />
      <div className={"relative flex h-full flex-col " + P3} style={{ paddingTop: SB.padTop, paddingLeft: SB.padLeft }}>
        <Piece meta={m(R.brand)} depth={18}><SidebarBrand collapsed={c} /></Piece>

        <div className={P3} style={{ padding: `${SB.team.padTop}px ${SB.team.padX}px ${SB.team.padBottom}px` }}>
          <Piece meta={m(R.teamCaption)} depth={18} style={{ marginBottom: SB.team.captionGap }}><SidebarTeamCaption collapsed={c} /></Piece>
          <Piece meta={m(R.teamSelector)} depth={18} slab={{ shape: "rounded-sq-l" }}><SidebarTeamSelector collapsed={c} /></Piece>
          <Piece meta={m(R.balance)} depth={22} slab={{ shape: "rounded-[12px]" }} style={{ marginTop: SB.team.balanceGap }}><SidebarBalance collapsed={c} /></Piece>
        </div>

        <div className={"min-h-0 flex-1 " + P3} style={{ padding: `${SB.body.padTop}px ${SB.body.padX}px ${SB.body.padBottom}px` }}>
          <div className={"flex flex-col " + P3} style={{ gap: SB.body.navGap }}>
            {SIDEBAR_NAV.map(({ key, label, Icon, active }, i) => (
              <Piece key={key} meta={m(R.nav[i])} depth={active ? 30 : 18}>
                <SidebarNavItem label={label} icon={<Icon />} active={active} collapsed={c} />
              </Piece>
            ))}
          </div>

          <Piece meta={m(R.featuredHeader)} depth={18} style={{ marginTop: SB.body.sectionHeaderMarginTop, marginBottom: SB.body.sectionHeaderMarginBottom }}>
            <SidebarSectionHeader label="Featured" collapsed={c} />
          </Piece>
          <div className={"flex flex-col " + P3} style={{ marginTop: SB.body.listMarginTop, paddingLeft: c ? COLLAPSED.body.listIndent : SB.body.listIndent, gap: SB.body.featuredGap, transition: COLLAPSED.transition.listIndent }}>
            {DEMO_FEATURED.map((proj, i) => (
              <Piece key={proj.id} meta={m(R.featuredRows[i])} depth={18}><SidebarProjectRow project={proj} collapsed={c} /></Piece>
            ))}
          </div>

          <Piece meta={m(R.groupsHeader)} depth={18} style={{ marginTop: SB.body.sectionHeaderMarginTop, marginBottom: SB.body.sectionHeaderMarginBottom }}>
            <SidebarSectionHeader label="Groups" collapsed={c} />
          </Piece>
          <div className={"flex flex-col " + P3} style={{ marginTop: SB.body.listMarginTop, paddingLeft: c ? COLLAPSED.body.listIndent : SB.body.listIndent, gap: SB.body.groupsGap, transition: COLLAPSED.transition.listIndent }}>
            {DEMO_ACCESS_GROUPS.map((g, i) => (
              <Piece key={g.id} meta={m(R.groupRows[i])} depth={18}><SidebarGroupRow name={g.name} collapsed={c} /></Piece>
            ))}
          </div>
        </div>

        {/* Pinned to the bottom of the (taller) board, like the real sidebar. */}
        <div className={"shrink-0 " + P3} style={{ padding: `${SB.settings.padTop}px ${SB.settings.padX}px ${SB.settings.padBottom}px` }}>
          <Piece meta={m(H - 92)} depth={18}><SidebarSettings collapsed={c} /></Piece>
        </div>
        <Piece meta={m(H - 62)} depth={18}><SidebarUserCard collapsed={c} /></Piece>
      </div>
    </div>
  )
}

function HeaderRow({ meta }: { meta: PieceMeta }) {
  return (
    <div className={"flex flex-row items-end justify-between gap-4 " + P3}>
      <Piece meta={meta} depth={22} flip="move"><ProjectsTitle /></Piece>
      <Piece meta={meta} depth={22} flip="move">
        <div className="flex flex-wrap items-center justify-end gap-2 self-auto">
          <NewGroupButton />
          <NewProjectButton />
        </div>
      </Piece>
    </div>
  )
}

// Layout position of `el` inside `root`, from offsets — unaffected by the 3D
// camera transforms around it (getBoundingClientRect would be projected).
function layoutRect(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

// Approximate top edges of the page's rows on the board (panel at y 64).
const PAGE_Y = { header: 92, groups: 192, org: [292, 636, 840], tileRows: [[322, 322, 478], [666, 666]] as number[][] }

function PagePieces() {
  const collapsed = useContext(CollapseCtx)
  let order = 0
  const m = (y: number): PieceMeta => ({ region: "page", order: order++, y })
  return (
    <div
      className={"absolute " + P3}
      style={{
        left: collapsed ? COLLAPSED.shell.x : PANEL.x,
        width: collapsed ? COLLAPSED.shell.width : PANEL.width,
        top: PANEL.y, height: H - PANEL.y,
      }}
    >
      <Piece meta={{ region: "panel", order: 0, y: PANEL.y }} depth={8} slab={{ shape: "rounded-tl-[22px]", color: "#dcd7cf" }} flip="box" className="absolute inset-0">
        <PanelSurface className="absolute inset-0" />
      </Piece>
      <div className={"absolute inset-0 " + P3}>
        <div className={"flex w-full flex-col " + P3} style={{ padding: `${PAGE.padY}px ${PAGE.padX}px`, gap: PAGE.sectionGap }}>
          {/* The header row, rebuilt from its parts so the title and the
              buttons move independently when the sidebar collapses. */}
          <HeaderRow meta={m(PAGE_Y.header)} />
          <Piece meta={m(PAGE_Y.groups)} depth={22} flip="move"><GroupsStrip /></Piece>
          <div className={"flex flex-col " + P3} style={{ gap: GRID.orgGap }}>
            {DEMO_ORGS.map((org, oi) => {
              const projects = projectsForOrg(org.key)
              return (
                <div key={org.key} className={P3}>
                  <Piece meta={m(PAGE_Y.org[oi])} depth={22} flip="box" style={{ marginBottom: GRID.headerToTiles }}>
                    <OrgHeader org={org} count={projects.length} />
                  </Piece>
                  {org.open && (
                    <div
                      className={"grid " + P3}
                      style={{ gap: GRID.tileGap, gridTemplateColumns: `repeat(auto-fill, minmax(${GRID.tileMinWidth}px, 1fr))` }}
                    >
                      {projects.map((proj, ti) => (
                        <Piece
                          key={proj.id}
                          meta={m(PAGE_Y.tileRows[oi]?.[ti] ?? PAGE_Y.org[oi] + 30)}
                          depth={44}
                          slab={{ shape: "rounded-sq-xl" }}
                          flip="box"
                          className="self-start" // the slab follows the tile, not the grid row
                        >
                          <ProjectTile project={proj} org={org} />
                        </Piece>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Window chrome above the app: traffic lights and the address, like the
// window the feature tour uses. Part of the board from the start.
function WindowTitleBar() {
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center gap-2 rounded-t-[22px] border-b border-[#e6e3de] bg-white px-5"
      style={{ height: FRAME_H }}
    >
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      <span className="absolute left-1/2 flex h-6 min-w-[300px] -translate-x-1/2 items-center justify-center rounded-md bg-[#f1f2f4] px-3 text-[12px] text-[#6b7280]">
        ucelot.com/projects
      </span>
    </div>
  )
}

// The whole board: back plate (thickness), the window (title bar + desk), then
// inside it sidebar → panel → top bar, which is the app's own paint order.
// `children` render on top.
export function Board({ motion: m, children }: { motion: BoardMotion; children?: React.ReactNode }) {
  // Collapse once progress passes collapseAt (a hair of hysteresis so it can't
  // flicker at the threshold); expand again when scrolling back above it.
  const [collapsed, setCollapsed] = useState(false)
  const collapsedRef = useRef(false)
  const { collapseAt } = m

  // Pre-rendered collapse (FLIP). Animating the panel/top bar's left + width
  // re-lays out and repaints the whole page every frame (every tile resizes),
  // which drops frames. Instead: record where the moving pieces are, switch to
  // the collapsed layout in one go, then animate each piece from its old box
  // to its new one with transforms only (compositor work, no re-layout), using
  // the app's duration and easing. The sidebar keeps its own CSS transitions —
  // they're small and cheap.
  const contentRef = useRef<HTMLDivElement>(null)
  const before = useRef(new Map<Element, ReturnType<typeof layoutRect>>())
  const toggle = (next: boolean) => {
    if (next === collapsedRef.current) return
    const root = contentRef.current
    before.current.clear()
    root?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => before.current.set(el, layoutRect(el, root)))
    collapsedRef.current = next
    setCollapsed(next)
  }
  useLayoutEffect(() => {
    const root = contentRef.current
    if (!root || before.current.size === 0) return
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const a = before.current.get(el)
      if (!a) return
      const b = layoutRect(el, root)
      const box = el.dataset.flip === "box"
      const dx = a.x - b.x, dy = a.y - b.y
      const sx = box && b.w ? a.w / b.w : 1, sy = box && b.h ? a.h / b.h : 1
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.002 && Math.abs(sy - 1) < 0.002) return
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: "none" }],
        { duration: COLLAPSED.transition.duration, easing: SIDEBAR_EASE },
      )
    })
    before.current.clear()
  }, [collapsed])

  useEffect(() => {
    if (collapseAt != null && m.p.get() >= collapseAt) toggle(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseAt, m.p])
  useMotionValueEvent(m.p, "change", (v) => {
    if (collapseAt == null) return
    // a hair of hysteresis so it can't flicker at the threshold
    toggle(collapsedRef.current ? v >= collapseAt - 0.01 : v >= collapseAt)
  })
  return (
    <>
      <div
        className="absolute inset-0 rounded-[22px] bg-[#cfc9c0] shadow-[0_80px_140px_-40px_rgba(0,0,0,0.75)]"
        style={{ transform: "translateZ(-16px)" }}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-b-[22px] bg-[color:var(--c-shell)]" style={{ top: FRAME_H }} />
      <WindowTitleBar />
      <div ref={contentRef} className={"absolute left-0 " + P3} style={{ top: FRAME_H, width: W, height: H }}>
        <BoardCtx.Provider value={m}>
          <CollapseCtx.Provider value={collapsed}>
            <GlowSpread />
            <SidebarPieces />
            <PagePieces />
            <TopbarPieces />
          </CollapseCtx.Provider>
        </BoardCtx.Provider>
      </div>
      {children}
    </>
  )
}
