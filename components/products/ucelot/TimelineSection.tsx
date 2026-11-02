"use client"

import { Fragment, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react"
import {
    motion, motionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform,
    type MotionValue,
} from "framer-motion"
import { GRAIN } from "./AmbientBackground"
import { bakeScrub } from "@/lib/scrollScrub"
import { useLiteGraphics } from "@/lib/useLiteGraphics"
import { useNearViewport } from "@/lib/useNearViewport"
import { Brick, brickCard, mix, pastelFor, weekStartMs } from "./app/screens/timeline"
import {
    FLOOR, FLOOR_BOX, floorSheetImage, PB_CELL, PB_FUTURE, PB_ORIGIN, PB_PLAN, PB_TILES, PB_TODAY_COL, PlayfulFloor, type FloorCells, type PlacedTile,
} from "./app/screens/timeline-playful"

// ─── Plan together: the timeline planning tool ──────────────────────────────
// A tall section (390vh) with a pinned, full-bleed stage holding one endless
// timeline floor (./app/screens/timeline-playful) at 60°.
//
//   Intro — time-based, once, when the stage first pins. A blank sheet — the
//   floor's paper in its lit shape, nothing on it — zooms in from small and
//   a little flatter, easing to rest at 60° as an ember bloom flares and
//   fades. Then the timeline morphs into it: the real floor (grid, weekends,
//   today, the date row) appears under the sheet and the sheet dissolves,
//   so the details draw in where the blank was. The heading fades in as it
//   settles.
//
//   Tiles — tied to scroll, but physical. The 20 tiles come in waves, one per
//   calendar week of start dates (≤ 5 each); pinned scroll progress p makes a
//   wave due as it crosses that wave's threshold (spread over p ∈ [0.1, 0.75]).
//   A due tile launches its whole gravity drop on its own real-time clock
//   (fall, squash, two bounces) through a queue with a minimum gap, so a wave
//   cascades, a fast scroll queues waves, and a slow one never slows a fall.
//   A backlog (a fast scroll) shortens the gap and quickens the falls so the
//   plan rains in rather than trickling, and past the last wave everything
//   still due rushes in — the plan is down before the stage leaves.
//   Drops only go one way: a tile falls once, on the way down, and stays.
//   Scrolling back leaves the plan where it is.
//
//   Exit — scroll-scrubbed, after a short hold on the finished plan: a calm,
//   endless drift. The timeline pans left along its own axis in plane space
//   (a brief ease-in, then a steady conveyor through ~2¾ months): grid,
//   weekend shading, date row, today's column and the plan slide out left
//   under a lit area that stays put, while later dates slide in from the right
//   and more planned work keeps landing on them — each week of it drops in
//   (same gravity) as its first slot passes ~80% across the stage. Planning
//   goes on forever. The heading clears left early. Scrolling back just runs
//   the drift backwards: the whole timeline, landed work and all, slides
//   flat back to the right.
//
// Runtime: the intro is baked into keyframes once and played by the compositor
// (IntroPlayer), so it never re-rasterises the floor from script. Each tile flight
// is baked into keyframes when it launches and played by the
// compositor (Web Animations), so a busy main thread can't stutter it; one
// light rAF loop (TileDirector) only schedules launches and notes landings —
// no per-frame writes, no React render per frame. Transforms and opacity
// only; masks are static. The exit's future work mounts ahead of time in
// small low-priority slices. Everything scroll-linked (the drift, the rise,
// the fades, the heading clearing) is pre-baked into keyframes the browser
// plays against the scroll itself (lib/scrollScrub) — no JavaScript per
// scroll frame.
//
// 3D: perspective wrapper (flat, unclipped) → plane root → floor, blank sheet,
// contact shadows (leaves) and tile movers → slab layers + face, preserve-3d
// the whole way; fades sit on leaves only. The stage clips, outside 3D.

const CELL = PB_CELL
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))
const clamp01 = (v: number) => clamp(v, 0, 1)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3)

// ════════════════════════════════════════════════════════════════════════════
// Camera
// ════════════════════════════════════════════════════════════════════════════

/** th: tilt (deg) · k: scale · (ax, ay): lattice point held at stage point (sx, sy). */
type Cam = { th: number; k: number; ax: number; ay: number; sx: number; sy: number }
type Rig = { vw: number; vh: number; P: number; oy: number; c0: Cam; c1: Cam }

const ZOOM = 1.3 // s: the blank sheet zooms in…
const MORPH = 0.7 // s: …then the timeline's details draw into it
const INTRO = ZOOM + MORPH

/** Both camera ends for a stage size. At rest the plan is centred with a
 *  margin each side; a phone pushes in on today instead (crops). */
function rigFor(vw: number, vh: number): Rig {
    const phone = vw < 768
    const k1 = phone ? clamp(vh / 1050, 0.6, 0.85) : clamp(Math.min(vw / 1895, vh / 1184), 0.55, 1.05)
    const rest: Cam = phone
        ? { th: 60, k: k1, ax: (PB_TODAY_COL + 4.5) * CELL, ay: PB_PLAN.y, sx: vw / 2, sy: vh * 0.72 }
        : { th: 60, k: k1, ax: 18 * CELL, ay: 4 * CELL, sx: vw / 2, sy: vh * 0.68 }
    return {
        vw,
        vh,
        P: clamp(1350 * k1, 800, 1700),
        oy: vh * 0.1,
        // Intro start: a small patch of the same spot, centred, flatter.
        c0: { ...rest, th: 37, k: k1 * 0.3, sy: vh * 0.56 },
        c1: rest,
    }
}

function camOf(t: number, rig: Rig): Cam {
    const u = easeOut(clamp01(t / ZOOM))
    const { c0, c1 } = rig
    return {
        th: lerp(c0.th, c1.th, u),
        k: Math.exp(lerp(Math.log(c0.k), Math.log(c1.k), u)),
        ax: lerp(c0.ax, c1.ax, u),
        ay: lerp(c0.ay, c1.ay, u),
        sx: lerp(c0.sx, c1.sx, u),
        sy: lerp(c0.sy, c1.sy, u),
    }
}

function camAt(t: number, rig: Rig): string {
    const { th, k, ax, ay, sx, sy } = camOf(t, rig)
    return `translate(${sx}px, ${sy}px) scale3d(${k}, ${k}, ${k}) rotateX(${th}deg) translate(${-ax}px, ${-ay}px)`
}

/** The lattice point (on the plane) seen at stage point (xs, ys) — the
 *  camera's projection run backwards (perspective P from (vw/2, oy)). */
function unproject(xs: number, ys: number, c: Cam, rig: Rig) {
    const sin = Math.sin((c.th * Math.PI) / 180)
    const cos = Math.cos((c.th * Math.PI) / 180)
    const den = c.k * (rig.P * cos + (ys - rig.oy) * sin)
    if (den <= 0) return null // at or past the horizon
    const d = (rig.P * (ys - c.sy)) / den
    const ox = rig.vw / 2
    return { x: c.ax + ((xs - ox) * (rig.P - c.k * d * sin) / rig.P - (c.sx - ox)) / c.k, y: c.ay + d }
}

const easeIn = (v: number) => v * v * v

/** The exit's drift: PAN_DAYS of timeline (lattice px), the same everywhere. */
const PAN_DAYS = 84
const PAN_TOTAL = PAN_DAYS * CELL
/** The pan is attached this far (vh of scroll) ahead of the exit. */
const PAN_AHEAD_VH = 20
/** Brief ease-in (the first DRIFT_IN of the exit), then a constant speed. */
const DRIFT_IN = 0.15
const drift = (u: number) => {
    const v = 1 / (1 - DRIFT_IN / 2) // the cruising speed that ends exactly at 1
    return u < DRIFT_IN ? (v * u * u) / (2 * DRIFT_IN) : v * (u - DRIFT_IN / 2)
}

// ════════════════════════════════════════════════════════════════════════════
// The floor a stage needs
// ════════════════════════════════════════════════════════════════════════════

/** The part of the floor the stage shows: what the camera sees at rest, in
 *  whole cells plus a margin (the real floor only appears once the zoom is
 *  over, and the exit pans the surface inside this fixed window). On a phone
 *  that is under a third of it. */
function floorCellsFor(rig: Rig): FloorCells {
    const c = rig.c1
    const corners = [unproject(0, 0, c, rig), unproject(rig.vw, 0, c, rig), unproject(0, rig.vh, c, rig), unproject(rig.vw, rig.vh, c, rig)]
    if (corners.some((p) => !p)) return FLOOR
    const xs = corners.map((p) => p!.x)
    const ys = corners.map((p) => p!.y)
    const M = 2
    return {
        c0: clamp(Math.floor(Math.min(...xs) / CELL) - M, FLOOR.c0, FLOOR.c1),
        c1: clamp(Math.ceil(Math.max(...xs) / CELL) + M, FLOOR.c0, FLOOR.c1),
        r0: clamp(Math.floor(Math.min(...ys) / CELL) - M, FLOOR.r0, FLOOR.r1),
        // The near edge stays where it is: Safari stops drawing a tilted
        // layer short of its near edge when that edge is just off screen
        // (rows that are on screen went missing), and the near rows are few.
        r1: FLOOR.r1,
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Tile physics
// ════════════════════════════════════════════════════════════════════════════

// Tile slab
const DEPTH = 9.5 // px the top face stands off the plane
const LAYERS = [2, 4.5, 7] // z of the stacked edge layers under the face
const LAYER_SHADE = [52, 40, 28] // % of the tile's accent mixed into its pastel (bottom → top)
// The lite build (phones, low-memory devices) keeps one mid edge layer: about
// half the composited layers per tile, still reading as a slab at phone size.
const EDGE_FULL = LAYERS.map((z, k) => ({ z, shade: LAYER_SHADE[k] }))
const EDGE_LITE = [{ z: LAYERS[1], shade: LAYER_SHADE[1] }]
const SHADOW_INSET = 6 // contact shadow core, inside the card's footprint
const SHADOW_REST = 0.6 // its opacity once the tile sits on the plane

// Light tiles (1 lane) and heavy tiles (2–3 lanes): the heavy ones drop from
// higher under stronger gravity (about the same fall time, harder impact),
// give less back on the bounce and squash less.
//   h  — drop height above the plane (lattice px, along its normal)
//   T  — fall time from h (free fall from rest: z = h·(1 − (t/T)²))
//   e  — restitution (bounce k rises e^(2k)·h and lasts 2·e^k·T)
//   q  — squash at the first impact (fraction of the slab's thickness)
//   st — stretch along the fall just before impact
type Phys = { h: number; T: number; e: number; q: number; st: number }
const LIGHT: Phys = { h: 230, T: 0.25, e: 0.3, q: 0.5, st: 0.3 }
const HEAVY: Phys = { h: 270, T: 0.26, e: 0.24, q: 0.38, st: 0.22 }
const CONTACT = [0.075, 0.055, 0.04] // time on the plane at each impact (s)
const SQUASH_DECAY = 0.42 // each later impact squashes this much of the last
const SPREAD = 0.09 // in-plane bulge per unit of thickness squash

// Scroll → due tiles; the launch queue.
// Scroll budget, in vh of pinned scroll (the section's height minus the stage).
// The section is h-[390vh]; its stage (100vh) pins for the rest. Positions are
// in vh of scroll since the stage pinned.
const WAVES_FROM_VH = 15 // first wave's threshold
const WAVES_TO_VH = 112.5 // last wave's
const HOLD_VH = 30 // the finished plan, held
const EXIT_FROM_VH = WAVES_TO_VH + HOLD_VH // exit: from here to the unpin (~148vh) and on

// During the exit the stage also rises, so the page moves on while the
// timeline drifts by. The rise waits until RISE_AT of the exit (the drift has
// the screen to itself first), eases in over RISE_RAMP to ALPHA of the scroll
// speed, and over the last BLEND eases up to 1, so the hand-over to the plain
// scroll at the sticky's release is seamless. The section's negative bottom
// margin is that total rise, so the next section meets the stage's bottom edge
// exactly as it lets go. riseOf: the rise so far, as a fraction of the exit's
// length (∫ of that rate; ∫ smoothstep = x³ − x⁴/2).
const RISE_AT = 0.55
const RISE_RAMP = 0.15
const ALPHA = 0.28
const BLEND = 0.1
const ssInt = (x: number) => x * x * x - (x * x * x * x) / 2
function riseOf(u: number) {
    const v = Math.min(Math.max(u, 0), 1)
    const ramp = ALPHA * RISE_RAMP * ssInt(clamp01((v - RISE_AT) / RISE_RAMP))
    const flat = ALPHA * Math.max(0, v - (RISE_AT + RISE_RAMP))
    const blend = (1 - ALPHA) * BLEND * ssInt(clamp01((v - (1 - BLEND)) / BLEND))
    return ramp + flat + blend
}
const RISE_TOTAL = riseOf(1)
// The stage's soft bottom edge while it rises: EDGE_MIN px deep as it lifts
// off, plus EDGE_GROW px per px of rise, up to EDGE_H of the stage.
const EDGE_MIN = 56
const EDGE_GROW = 1.4
const EDGE_H = 0.4
const MAX_WAVE = 5 // tiles per wave at most
const LAUNCH_GAP = 0.09 // s between launches — a wave cascades, overlapping waves queue
// Catch-up: pressure 0…1, from the backlog of due-but-unlaunched tiles (more
// than a wave's worth) or from the scroll running past the last wave (rush).
// At full pressure the gap shrinks to RUSH_GAP of itself and falls take
// RUSH_TIME of their time, several launches per frame if need be.
const RUSH_GAP = 0.2
const RUSH_TIME = 0.6
const RUSH_FROM_VH = WAVES_TO_VH + 8 // past here the plan should already be down…
const RUSH_FULL_VH = EXIT_FROM_VH // …and by here, everything still due rushes
const FRAME_SLACK = 0.008 // half a 60 Hz frame, so a gap isn't rounded up a whole frame

/** z: height above the plane · sxy / sz: in-plane / thickness scale · rx, rz: tilt (deg) · o: opacity */
type Pose = { z: number; sxy: number; sz: number; rx: number; rz: number; o: number }
const REST: Pose = { z: 0, sxy: 1, sz: 1, rx: 0, rz: 0, o: 1 }

type Seg =
    | { kind: "fall"; t0: number; dur: number }
    | { kind: "contact"; t0: number; dur: number; q: number; st: number }
    | { kind: "bounce"; t0: number; dur: number; h: number }

type Drop = { h0: number; o0: number; rx0: number; rz0: number; st: number; segs: Seg[]; land: number; end: number }

/** A drop from rest at height h0 (≤ p.h) under the tile's gravity: a lower
 *  start falls for less time and hits softer (impact speed ∝ √h0). `k` scales
 *  its timing (< 1: a quicker fall, for catching up). */
function buildDrop(p: Phys, h0: number, o0: number, rx0: number, rz0: number, k = 1): Drop {
    const f = clamp01(h0 / p.h)
    const T0 = Math.max(0.001, p.T * Math.sqrt(f) * k)
    const v = Math.sqrt(f)
    const segs: Seg[] = [{ kind: "fall", t0: 0, dur: T0 }]
    let t = T0
    let q = p.q * v
    for (let n = 0; n < CONTACT.length; n++) {
        segs.push({ kind: "contact", t0: t, dur: CONTACT[n] * k, q, st: n === 0 ? p.st * v : 0 })
        t += CONTACT[n] * k
        q *= SQUASH_DECAY
        if (n < 2) {
            const ek = Math.pow(p.e, n + 1)
            segs.push({ kind: "bounce", t0: t, dur: 2 * ek * T0, h: ek * ek * h0 })
            t += 2 * ek * T0
        }
    }
    return { h0, o0, rx0, rz0, st: p.st * v, segs, land: T0, end: t }
}

const bulge = (sz: number) => 1 + SPREAD * (1 - sz)

function dropPose(d: Drop, tau: number): Pose {
    if (tau >= d.end) return REST
    for (const s of d.segs) {
        if (tau >= s.t0 + s.dur) continue
        const u = clamp01((tau - s.t0) / s.dur)
        if (s.kind === "fall") {
            // Free fall from rest (quadratic ease-in). It fades in over the
            // first third, stretches a touch as it speeds up, levels out.
            const sz = 1 + d.st * u * u
            const f = Math.min(1, u / 0.3)
            const w = (1 - u) * (1 - u)
            return { z: d.h0 * (1 - u * u), sxy: bulge(sz), sz, rx: d.rx0 * w, rz: d.rz0 * w, o: d.o0 + (1 - d.o0) * (1 - (1 - f) * (1 - f)) }
        }
        if (s.kind === "contact") {
            const sz = 1 - s.q * Math.sin(Math.PI * u) + s.st * Math.pow(1 - u, 3)
            return { z: 0, sxy: bulge(sz), sz, rx: 0, rz: 0, o: 1 }
        }
        return { z: s.h * 4 * u * (1 - u), sxy: 1, sz: 1, rx: 0, rz: 0, o: 1 }
    }
    return REST
}

// All tiles: the plan (0 … N0−1), then the future work (N0 … NT−1).
const TILES: PlacedTile[] = [...PB_TILES, ...PB_FUTURE]
const N0 = PB_TILES.length
const NT = TILES.length
const NF = NT - N0
const FUTURE_SLICE = 6 // future tiles mounted per idle slice
const byTime = (a: number, b: number) => TILES[a].issue.startDay - TILES[b].issue.startDay || TILES[a].issue.row! - TILES[b].issue.row!

// Rank order: through time — by start day, far lane first; the plan, then the
// future. rank → tile index. What is due is always a prefix of it.
const ORDER = PB_TILES.map((_, i) => i).sort(byTime)
const RANKED = [...ORDER, ...PB_FUTURE.map((_, j) => N0 + j).sort(byTime)]

/** Rank runs → groups: one per calendar week of start dates, capped at
 *  MAX_WAVE (a full week's latest tiles join the next group). */
function weekGroups(ranks: number[]): number[][] {
    const weeks: number[][] = []
    let key: number | null = null
    ranks.forEach((r) => {
        const k = weekStartMs(TILES[RANKED[r]].issue.start!)
        if (k !== key) weeks.push([])
        key = k
        weeks[weeks.length - 1].push(r)
    })
    for (let w = 0; w < weeks.length; w++) {
        if (weeks[w].length <= MAX_WAVE) continue
        const spill = weeks[w].splice(MAX_WAVE)
        if (w + 1 < weeks.length) weeks[w + 1].unshift(...spill)
        else weeks.push(spill)
    }
    return weeks
}
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, k) => a + k)

// Waves (the plan): each has one scroll threshold; crossing it makes the whole
// wave due, and its tiles cascade in rank order.
const WAVES: number[] = weekGroups(range(0, N0)).map((g) => g.length)
const WAVE_VH = WAVES.map((_, k) => WAVES_FROM_VH + ((WAVES_TO_VH - WAVES_FROM_VH) * k) / Math.max(1, WAVES.length - 1))
const dueCount = (dvh: number) => WAVES.reduce((n, size, k) => (dvh >= WAVE_VH[k] ? n + size : n), 0)

// Future groups (the exit): each drops as its first tile's slot passes
// TRIGGER_X across the stage while the timeline drifts left.
const FUTURE_GROUPS = weekGroups(range(N0, NT)).map((g) => ({ size: g.length, first: RANKED[g[0]] }))
const TRIGGER_X = 0.8 // of the stage width

/** For each future group, the pan (lattice px) at which its first slot
 *  projects to TRIGGER_X — the exact inverse of the camera's projection. */
function futureTriggers(r: Rig): number[] {
    const c = r.c1
    const sin = Math.sin((c.th * Math.PI) / 180)
    return FUTURE_GROUPS.map(({ first }) => {
        const t = TILES[first]
        const f = r.P / (r.P - c.k * (t.top + t.height / 2 - c.ay) * sin)
        return t.left - c.ax - (TRIGGER_X * r.vw - r.vw / 2) / (c.k * f)
    })
}
/** Future tiles due at a given pan: the prefix of groups it has passed. */
function futureDue(pan: number, triggers: number[]) {
    let n = 0
    for (let g = 0; g < triggers.length && pan >= triggers[g]; g++) n += FUTURE_GROUPS[g].size
    return n
}

const PHYS: Phys[] = new Array(NT)
const TUMBLE: { rx: number; rz: number }[] = new Array(NT)
RANKED.forEach((i, r) => {
    PHYS[i] = TILES[i].span > 1 ? HEAVY : LIGHT
    const sign = r % 2 === 0 ? 1 : -1
    TUMBLE[i] = { rx: sign * (4 + ((r * 37) % 4)), rz: -sign * (2.5 + ((r * 53) % 4)) }
})
const hiddenPose = (i: number): Pose => ({ z: PHYS[i].h, sxy: 1, sz: 1, rx: TUMBLE[i].rx, rz: TUMBLE[i].rz, o: 0 })

// Today's pulse (seconds since the last tile landed).
const PULSE = { pill: 0.45, ring: 0.7, band: 0.85 }
const PULSE_END = Math.max(PULSE.pill, PULSE.ring, PULSE.band)
const PULSE_IDLE = 99

// ════════════════════════════════════════════════════════════════════════════
// TileDirector — one rAF loop for every tile
// ════════════════════════════════════════════════════════════════════════════

type TileMVs = {
    tf: MotionValue<string>
    op: MotionValue<number>
    shTf: MotionValue<string>
    shOp: MotionValue<number>
    /** Hidden tiles aren't drawn at all (no compositing cost off-stage). */
    vis: MotionValue<string>
}
type TileState =
    | { mode: "hidden" }
    | { mode: "rest" }
    | { mode: "fall"; t0: number; d: Drop; landed: boolean }

/** The DOM a tile's baked flights play on: the mover (transform), the contact
 *  shadow (transform + opacity) and the leaves that fade (edge layers, face). */
type TileEls = { mover: HTMLElement; shadow: HTMLElement; leaves: HTMLElement[] }

const tfOf = (p: Pose) =>
    p === REST ? "none" : `translateZ(${p.z}px) rotateX(${p.rx}deg) rotateZ(${p.rz}deg) scale3d(${p.sxy}, ${p.sxy}, ${p.sz})`
// Keyframes always spell out the full list, so every pair interpolates alike.
const tfFull = (p: Pose) => `translateZ(${p.z}px) rotateX(${p.rx}deg) rotateZ(${p.rz}deg) scale3d(${p.sxy}, ${p.sxy}, ${p.sz})`
const BAKE_FPS = 60 // keyframe density of a baked flight

class TileDirector {
    readonly mvs: TileMVs[]
    readonly pulse = motionValue(PULSE_IDLE)
    private st: TileState[]
    private els: (TileEls | null)[] = new Array(NT).fill(null)
    private anims: Animation[][] = TILES.map(() => [])
    /** Finished flights, cancelled a frame later once the still pose is drawn. */
    private retired: Animation[] = []
    private dueMain = 0 // plan tiles due (scroll waves)
    private dueFuture = 0 // future tiles due (exit drift)
    private ready = false
    private lastLaunch = -Infinity
    private rush = 0 // 0…1, from the scroll running past the last wave
    private pulseAt: number | null = null
    private raf: number | null = null

    constructor() {
        this.st = TILES.map(() => ({ mode: "hidden" }))
        this.mvs = TILES.map((_, i) => {
            const p = hiddenPose(i)
            return {
                tf: motionValue(tfOf(p)),
                op: motionValue(0),
                shTf: motionValue(this.shadowTf(i, p)),
                shOp: motionValue(0),
                vis: motionValue("hidden"),
            }
        })
    }

    /** A mounted tile hands over its DOM; returns the unregister. */
    register(i: number, els: TileEls) {
        this.els[i] = els
        this.kick()
        return () => {
            this.cancel(i)
            this.els[i] = null
        }
    }

    /** How many plan tiles (by rank) the scroll waves say are due. */
    setDue(n: number) {
        // Drops only go one way: scrolling back never takes a tile back off.
        if (n <= this.dueMain) return
        this.dueMain = n
        this.kick()
    }
    /** How many future tiles (by rank) the exit's drift says are due. */
    setFutureDue(n: number) {
        if (n <= this.dueFuture) return
        this.dueFuture = n
        this.kick()
    }
    /** Due tiles, as a prefix of RANKED: the future only once the plan is in. */
    private get due() {
        return this.dueMain < N0 ? this.dueMain : N0 + this.dueFuture
    }
    /** How far the scroll has run past the point the plan should be down by. */
    setRush(r: number) {
        if (r === this.rush) return
        this.rush = r
        this.kick()
    }
    /** The intro has finished: tiles may launch. */
    setReady() {
        this.ready = true
        this.kick()
    }
    /** Reduced motion: everything placed, no animation. */
    placeAll() {
        this.stop()
        for (let i = 0; i < N0; i++) {
            this.cancel(i)
            this.st[i] = { mode: "rest" }
            this.still(i, REST, true)
        }
    }
    stop() {
        if (this.raf != null) cancelAnimationFrame(this.raf)
        this.raf = null
    }

    private kick() {
        if (this.raf == null && typeof window !== "undefined") this.raf = requestAnimationFrame(this.tick)
    }

    private shadowTf(i: number, p: Pose) {
        const near = 1 - clamp01(p.z / PHYS[i].h)
        return `translateZ(1.5px) scale(${(0.55 + 0.45 * near) * p.sxy})`
    }
    private shadowOp(i: number, p: Pose) {
        const near = 1 - clamp01(p.z / PHYS[i].h)
        return SHADOW_REST * near * near * near * Math.min(1, p.o * 1.5)
    }

    /** A still pose, written through the motion values (rest, hidden, and the
     *  first frame of a flight). */
    private still(i: number, p: Pose, visible: boolean) {
        const m = this.mvs[i]
        m.tf.set(tfOf(p))
        m.op.set(p.o)
        m.shTf.set(this.shadowTf(i, p))
        m.shOp.set(this.shadowOp(i, p))
        m.vis.set(visible ? "visible" : "hidden")
    }

    /** Bake a whole flight into keyframes and hand it to the compositor: it
     *  plays off the main thread, so a busy page (or a slow phone) can't make
     *  it stutter, and nothing is written per frame. */
    private play(i: number, dur: number, poseOf: (tau: number) => Pose) {
        this.cancel(i)
        const el = this.els[i]
        if (!el) return
        const n = Math.max(2, Math.ceil(dur * BAKE_FPS) + 1)
        const tf: Keyframe[] = []
        const sh: Keyframe[] = []
        const op: Keyframe[] = []
        for (let k = 0; k < n; k++) {
            const p = poseOf((dur * k) / (n - 1))
            tf.push({ transform: tfFull(p) })
            sh.push({ transform: this.shadowTf(i, p), opacity: this.shadowOp(i, p) })
            op.push({ opacity: p.o })
        }
        const timing: KeyframeAnimationOptions = { duration: dur * 1000, easing: "linear", fill: "forwards" }
        this.anims[i] = [el.mover.animate(tf, timing), el.shadow.animate(sh, timing), ...el.leaves.map((l) => l.animate(op, timing))]
    }
    private cancel(i: number) {
        for (const a of this.anims[i]) a.cancel()
        this.anims[i] = []
    }
    /** A flight is over: its end pose goes into the motion values now, and the
     *  animation (holding that same pose) is dropped next frame — no flash. */
    private settle(i: number, s: TileState, p: Pose, visible: boolean) {
        this.st[i] = s
        this.still(i, p, visible)
        this.retired.push(...this.anims[i])
        this.anims[i] = []
    }

    /** A full drop from the tile's hidden pose. */
    private launch(i: number, t: number, k: number) {
        const ph = PHYS[i]
        const d = buildDrop(ph, ph.h, 0, TUMBLE[i].rx, TUMBLE[i].rz, k)
        this.st[i] = { mode: "fall", t0: t, d, landed: false }
        this.still(i, dropPose(d, 0), true)
        this.play(i, d.end, (tau) => dropPose(d, tau))
    }

    private tick = (now: number) => {
        this.raf = null
        const t = now / 1000
        let busy = false
        let landedNow = false

        // 0. Drop the animations of flights that settled last frame.
        for (const a of this.retired) a.cancel()
        this.retired = []

        // 1. Flights run on the compositor; here we only note where each is.
        for (let i = 0; i < NT; i++) {
            const s = this.st[i]
            if (s.mode === "fall") {
                const tau = t - s.t0
                if (!s.landed && tau >= s.d.land) {
                    s.landed = true
                    if (i < N0) landedNow = true
                }
                if (tau >= s.d.end) this.settle(i, { mode: "rest" }, REST, true)
                busy = true
            }
        }

        // 2. Today pulses when the plan's last tile lands.
        if (landedNow && this.st.slice(0, N0).every((s) => s.mode === "rest" || (s.mode === "fall" && s.landed))) this.pulseAt = t
        if (this.pulseAt != null) {
            const pv = t - this.pulseAt
            if (pv >= PULSE_END) {
                this.pulseAt = null
                this.pulse.set(PULSE_IDLE)
            } else {
                this.pulse.set(pv)
                busy = true
            }
        }

        // 3. Dispatch: launch what is due (in order) with a minimum gap. A tile
        //    whose DOM isn't mounted yet waits its turn.
        let pending = false
        if (this.ready) {
            const due = this.due
            let backlog = 0
            let planBehind = false
            for (let r = 0; r < due; r++) {
                if (this.st[RANKED[r]].mode === "hidden") {
                    backlog++
                    if (r < N0) planBehind = true
                }
            }
            // The rush is for the plan only; the exit's future work keeps its pace.
            const pressure = Math.max(planBehind ? this.rush : 0, clamp01((backlog - MAX_WAVE) / (2 * MAX_WAVE)))
            const gap = LAUNCH_GAP * lerp(1, RUSH_GAP, pressure)
            const k = lerp(1, RUSH_TIME, pressure)
            // Launches owed since the last one (one at a time when calm).
            let budget = Math.min(pressure > 0.5 ? 3 : 1, Math.floor((t - this.lastLaunch + FRAME_SLACK) / gap))
            for (let r = 0; r < due && budget > 0; r++) {
                const i = RANKED[r]
                const m = this.st[i].mode
                if (m === "hidden" && this.els[i]) {
                    this.launch(i, t, k)
                    this.lastLaunch = t
                    budget--
                    busy = true
                }
            }
            if (backlog > 0) pending = true
        }

        if (busy || pending || this.retired.length) this.kick()
    }
}

// ════════════════════════════════════════════════════════════════════════════
// IntroPlayer — the opening, baked
// ════════════════════════════════════════════════════════════════════════════

// The opening's pieces at time t (s): the camera (camAt), the blank sheet
// and the real floor (the morph), the bloom and the heading.
const smooth = (v: number) => v * v * (3 - 2 * v)
/** The blank sheet: whole while it zooms, then dissolving off the floor. */
const blankAt = (t: number) => ({ opacity: 1 - smooth(clamp01((t - ZOOM) / MORPH)) })
/** The real floor: only drawn once the camera is at rest (so it's rasterised
 *  once, at its final scale), under the blank as that dissolves. */
const floorAt = (t: number) => ({ visibility: t >= ZOOM - 1 / 60 ? "visible" : "hidden" })
const BLOOM_SCALE = 1.6
const bloomAt = (t: number) => {
    const u = t / 1.5
    return { opacity: t <= 0 ? 0 : u < 0.12 ? u / 0.12 : 1 - easeOut(clamp01((u - 0.12) / 0.88)) }
}
const headingAt = (t: number) => {
    const v = clamp01((t - (ZOOM - 0.35)) / 0.7)
    return { opacity: v, transform: `translateY(${18 * (1 - v)}px)` }
}

type IntroEls = { plane: HTMLElement | null; floor: HTMLElement | null; blank: HTMLElement | null; bloom: HTMLElement | null; heading: HTMLElement | null }

/** Plays the opening once: every piece sampled into keyframes and handed to
 *  the compositor (Web Animations), the way the tiles' flights are. Only the
 *  blank sheet — a small image the GPU scales — moves with the camera; the
 *  real floor isn't drawn until the camera is at rest. (Zooming the real
 *  floor had Safari rasterise it again at every new scale: the memory spike
 *  that took mobile Safari down as the section started.) Still poses
 *  (before, after, reduced motion, a resize) are written straight to the
 *  elements. */
class IntroPlayer {
    private rig: Rig | null = null
    private els: IntroEls = { plane: null, floor: null, blank: null, bloom: null, heading: null }
    private anims: Animation[] = []
    private phase: "idle" | "playing" | "done" = "idle"
    private rate = 1
    private hurried = false

    constructor(private onDone: () => void) {}

    /** The stage and the section hand over their pieces as they mount. */
    attach(part: Partial<IntroEls>) {
        Object.assign(this.els, part)
        this.refresh()
    }
    setRig(rig: Rig) {
        this.rig = rig
        this.refresh()
    }
    start() {
        if (this.phase !== "idle") return
        this.phase = "playing"
        this.bake(0)
    }
    /** Play the rest quicker (a scroll that's already well into the waves). */
    hurry() {
        const lead = this.anims[0]
        if (this.phase !== "playing" || this.hurried || !lead) return
        const left = INTRO - Number(lead.currentTime ?? 0) / 1000
        if (left <= 0) return
        this.hurried = true
        this.rate = left / Math.max(0.3, left * 0.35)
        for (const a of this.anims) a.updatePlaybackRate(this.rate)
    }
    /** Reduced motion: straight to the end. */
    finish() {
        this.phase = "done"
        this.cancel()
        this.still(INTRO)
    }

    private refresh() {
        if (this.phase === "playing") {
            const lead = this.anims[0]
            this.bake(lead ? Number(lead.currentTime ?? 0) / 1000 : 0)
        } else this.still(this.phase === "done" ? INTRO : 0)
    }
    private cancel() {
        for (const a of this.anims) a.cancel()
        this.anims = []
    }
    private still(t: number) {
        const { plane, floor, blank, bloom, heading } = this.els
        if (plane && this.rig) plane.style.transform = camAt(t, this.rig)
        if (floor) Object.assign(floor.style, floorAt(t))
        if (blank) Object.assign(blank.style, blankAt(t))
        if (bloom) Object.assign(bloom.style, bloomAt(t))
        if (heading) Object.assign(heading.style, headingAt(t))
    }
    private bake(t0: number) {
        this.cancel()
        const rig = this.rig
        const { plane, floor, blank, bloom, heading } = this.els
        // The camera is the clock: without it (not measured yet) nothing plays.
        if (!rig || !plane) return
        const n = Math.ceil(INTRO * BAKE_FPS) + 1
        const ts = Array.from({ length: n }, (_, k) => (INTRO * k) / (n - 1))
        const timing: KeyframeAnimationOptions = { duration: INTRO * 1000, easing: "linear", fill: "forwards" }
        const play = (el: HTMLElement, frames: Keyframe[]) => {
            const a = el.animate(frames, timing)
            a.currentTime = t0 * 1000
            a.playbackRate = this.rate
            this.anims.push(a)
        }
        play(plane, ts.map((t) => ({ transform: camAt(t, rig) })))
        if (floor) play(floor, ts.map(floorAt))
        if (blank) play(blank, ts.map(blankAt))
        if (bloom) play(bloom, ts.map(bloomAt))
        if (heading) play(heading, ts.map(headingAt))
        const lead = this.anims[0]
        lead.finished.then(
            () => {
                if (this.anims[0] !== lead) return
                this.phase = "done"
                this.still(INTRO)
                this.cancel()
                this.onDone()
            },
            () => {},
        )
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Pieces
// ════════════════════════════════════════════════════════════════════════════

const P3D = { transformStyle: "preserve-3d" } as const

function DropTile({ tile, i, director, lite }: { tile: PlacedTile; i: number; director: TileDirector; lite: boolean }) {
    const mv = director.mvs[i]
    const mover = useRef<HTMLDivElement>(null)
    const shadow = useRef<HTMLDivElement>(null)
    useIsoLayoutEffect(() => {
        const m = mover.current!
        return director.register(i, { mover: m, shadow: shadow.current!, leaves: [...m.querySelectorAll<HTMLElement>("[data-leaf]")] })
    }, [director, i, lite])
    const edge = lite ? EDGE_LITE : EDGE_FULL
    const card = brickCard(tile, CELL)
    const { bg, fg } = pastelFor(tile.issue.id)
    const cardBox = { left: card.left, top: card.top, width: card.width, height: card.height, borderRadius: card.radius }
    return (
        <>
            {/* Contact shadow: lies on the plane; faint and small while the tile
                is high, growing and darkening as it comes down. */}
            <motion.div
                ref={shadow}
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                    left: tile.left + card.left + SHADOW_INSET,
                    top: tile.top + card.top + SHADOW_INSET + 3,
                    width: card.width - SHADOW_INSET * 2,
                    height: card.height - SHADOW_INSET * 2,
                    borderRadius: card.radius,
                    background: "rgba(38, 28, 22, 0.2)",
                    boxShadow: "0 0 20px 9px rgba(38, 28, 22, 0.17)",
                    transform: mv.shTf,
                    opacity: mv.shOp,
                    visibility: mv.vis,
                }}
            />
            <motion.div
                ref={mover}
                className="absolute"
                style={{
                    left: tile.left,
                    top: tile.top,
                    width: tile.width,
                    height: tile.height,
                    ...P3D,
                    transform: mv.tf,
                    visibility: mv.vis,
                    // Pivot at the slab's base, under the card's centre.
                    transformOrigin: `${card.left + card.width / 2}px ${card.top + card.height / 2}px 0px`,
                }}
            >
                {/* The slab's edge: stacked layers in darker shades of the tile's
                    own pastel, under the card only (the dashed tail is not a task). */}
                {edge.map(({ z, shade }) => (
                    <motion.div
                        key={z}
                        data-leaf
                        className="absolute"
                        style={{ ...cardBox, background: `color-mix(in srgb, ${fg} ${shade}%, ${bg})`, transform: `translateZ(${z}px)`, opacity: mv.op }}
                    />
                ))}
                {/* Top face — the real tile, exactly. */}
                <motion.div
                    data-leaf
                    className="absolute inset-0"
                    style={{ transform: `translateZ(${DEPTH}px)`, opacity: mv.op }}
                >
                    <Brick issue={tile.issue} cell={CELL} origin={PB_ORIGIN} style={{ left: 0, top: 0 }} />
                </motion.div>
            </motion.div>
        </>
    )
}

function TodayPill({ pulse, children }: { pulse: MotionValue<number>; children: ReactNode }) {
    const scale = useTransform(pulse, (t) => 1 + 0.22 * Math.sin(Math.PI * clamp01(t / PULSE.pill)))
    const ringScale = useTransform(pulse, (t) => 1 + 0.8 * easeOut(clamp01(t / PULSE.ring)))
    const ringOpacity = useTransform(pulse, (t) => 0.65 * (1 - easeOut(clamp01(t / PULSE.ring))) * (t < PULSE.ring ? 1 : 0))
    return (
        <div className="relative">
            <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-[color:var(--c-primary)]"
                style={{ scale: ringScale, opacity: ringOpacity }}
            />
            <motion.div style={{ scale }}>{children}</motion.div>
        </div>
    )
}

/** Today's column lights up and runs off into the distance (its own leaf). */
function TodayFlash({ pulse }: { pulse: MotionValue<number> }) {
    const opacity = useTransform(pulse, (t) => {
        const u = clamp01(t / PULSE.band)
        if (u <= 0 || u >= 1) return 0
        return u < 0.22 ? easeOut(u / 0.22) : 1 - easeOut((u - 0.22) / 0.78)
    })
    const fade = "linear-gradient(to bottom, transparent 0%, #000 45%, #000 85%, transparent 100%)"
    return (
        <motion.div
            aria-hidden
            className="ucelot-app pointer-events-none absolute"
            style={{
                left: PB_TODAY_COL * CELL,
                top: FLOOR_BOX.y,
                width: CELL,
                height: FLOOR_BOX.h,
                background: mix("--c-primary", 20),
                maskImage: fade,
                WebkitMaskImage: fade,
                transform: "translateZ(0.25px)",
                opacity,
            }}
        />
    )
}

/** The floor with nothing on it, as one small image (floorSheetImage) laid
 *  over the floor's box: what the intro zooms in. */
function BlankSheet({ src, player }: { src: string; player: IntroPlayer }) {
    const ref = useRef<HTMLImageElement>(null)
    useIsoLayoutEffect(() => {
        player.attach({ blank: ref.current })
        return () => player.attach({ blank: null })
    }, [player])
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            ref={ref}
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ left: FLOOR_BOX.x, top: FLOOR_BOX.y, width: FLOOR_BOX.w, height: FLOOR_BOX.h, transform: "translateZ(0.5px)", ...blankAt(0) }}
        />
    )
}

/** Ember bloom from the centre as the sheet comes in (screen space, over it;
 *  played by the IntroPlayer, bloomAt). It holds its size and only fades, so
 *  it's rasterised once, for the part on screen. */
function Bloom({ player }: { player: IntroPlayer }) {
    const ref = useRef<HTMLDivElement>(null)
    useIsoLayoutEffect(() => {
        player.attach({ bloom: ref.current })
        return () => player.attach({ bloom: null })
    }, [player])
    return (
        <div
            ref={ref}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[56%] h-[90vmax] w-[90vmax] rounded-full"
            style={{
                ...bloomAt(0),
                transform: `translateX(-50%) translateY(-50%) scale(${BLOOM_SCALE})`,
                background: "radial-gradient(closest-side, rgba(255,150,60,0.34), rgba(233,115,15,0.14) 45%, rgba(233,115,15,0) 100%)",
            }}
        />
    )
}

// ════════════════════════════════════════════════════════════════════════════
// The stage
// ════════════════════════════════════════════════════════════════════════════

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

function Stage({
    player, opening, director, futureN, panRefs, triggersRef, lite,
}: {
    player: IntroPlayer
    /** The intro hasn't finished: the blank sheet and the bloom are still up. */
    opening: boolean
    director: TileDirector
    /** The two layers the exit's drift pans (baked by the section). */
    panRefs: { surface: Ref<HTMLDivElement>; sheet: Ref<HTMLDivElement> }
    /** Where each future group comes due, for the section's scroll handler. */
    triggersRef: { current: number[] }
    /** Lighter tiles for phones and low-memory devices. */
    lite: boolean
    /** How many of the exit's future tiles are mounted (in rank order). */
    futureN: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const plane = useRef<HTMLDivElement>(null)
    const floor = useRef<HTMLDivElement>(null)
    const [rig, setRig] = useState<Rig | null>(null)
    // Only the part of the floor this stage shows is drawn.
    const [cells, setCells] = useState<FloorCells>(FLOOR)
    useIsoLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        player.attach({ plane: plane.current, floor: floor.current })
        const update = () => {
            const r = rigFor(el.clientWidth, el.clientHeight)
            const c = floorCellsFor(r)
            triggersRef.current = futureTriggers(r)
            setRig(r)
            setCells((p) => (p.c0 === c.c0 && p.c1 === c.c1 && p.r0 === c.r0 && p.r1 === c.r1 ? p : c))
            player.setRig(r)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => {
            ro.disconnect()
            player.attach({ plane: null, floor: null })
        }
    }, [player])
    // The blank sheet, painted once in the floor's own paper colour.
    const [blankSrc, setBlankSrc] = useState<string | null>(null)
    useEffect(() => {
        const app = floor.current?.querySelector(".ucelot-app")
        const paper = (app && getComputedStyle(app).getPropertyValue("--c-shell").trim()) || "#f1efec"
        setBlankSrc(floorSheetImage(paper))
    }, [])

    const mountedFuture = useMemo(() => new Set(RANKED.slice(N0, N0 + futureN)), [futureN])
    // Exit: the timeline drifts left along its own X axis, inside the tilt —
    // on past the release until the stage has left the screen (baked by the
    // section onto panRefs); the future work comes due as its weeks pass
    // TRIGGER_X.

    return (
        <div ref={ref} className="absolute inset-0" style={{ visibility: rig ? undefined : "hidden" }}>
            {/* Perspective wrapper — flat, unclipped. */}
            <div className="absolute inset-0" style={{ perspective: rig?.P ?? 1200, perspectiveOrigin: `50% ${rig?.oy ?? 0}px` }}>
                {/* The plane: lattice (0, 0) = day 0 · lane 0. Its transform
                    (the camera) is the IntroPlayer's. */}
                <div ref={plane} className="absolute left-0 top-0" style={{ ...P3D, transformOrigin: "0 0" }}>
                    {/* The floor: its lit window stays put; its surface (grid, weekend
                        shading, today's column, date row) pans with the tiles, so an
                        endless timeline slides by under a fixed light. */}
                    {/* Hidden until the intro's zoom is over (IntroPlayer, floorAt). */}
                    <div ref={floor} style={{ visibility: "hidden" }}>
                        <PlayfulFloor
                            wrapToday={(pill) => <TodayPill pulse={director.pulse}>{pill}</TodayPill>}
                            surfaceRef={panRefs.surface}
                            cells={cells}
                        />
                    </div>
                    {/* The blank sheet the intro zooms in, over the floor. */}
                    {opening && blankSrc && <BlankSheet src={blankSrc} player={player} />}
                    {/* Everything else on the plane, panned with it as one rigid sheet. */}
                    <div ref={panRefs.sheet} className="absolute left-0 top-0" style={P3D}>
                        <TodayFlash pulse={director.pulse} />
                        {TILES.map((tile, i) =>
                            i < N0 || mountedFuture.has(i) ? (
                                <Fragment key={tile.issue.id}>
                                    <DropTile tile={tile} i={i} director={director} lite={lite} />
                                </Fragment>
                            ) : null,
                        )}
                    </div>
                </div>
            </div>
            {opening && <Bloom player={player} />}
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Section
// ════════════════════════════════════════════════════════════════════════════

function Ember({ children }: { children: ReactNode }) {
    return <span className="text-[#f59a42]">{children}</span>
}

export default function TimelineSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const [director] = useState(() => new TileDirector())
    const reduce = useReducedMotion()
    const lite = useLiteGraphics()
    // Far off screen the stage's layers are dropped.
    const near = useNearViewport(sectionRef)
    // The exit's future work mounts ahead of time, FUTURE_SLICE tiles per idle
    // slice as a low-priority update, from when the intro finishes. (Mounting
    // it all at once as the plan completed froze slower phones for a moment.)
    const [futureN, setFutureN] = useState(0)
    const [growFuture, setGrowFuture] = useState(false)
    // The intro plays once, time-based, the first time the stage pins; scroll
    // never drives it and it never replays. Once it's over the tiles may fall,
    // and the blank sheet and the bloom (spent) are dropped.
    const [opening, setOpening] = useState(true)
    const [player] = useState(
        () =>
            new IntroPlayer(() => {
                director.setReady()
                setGrowFuture(true)
                setOpening(false)
            }),
    )
    useEffect(() => {
        if (!growFuture || futureN >= NF) return
        const next = () => startTransition(() => setFutureN((n) => Math.min(NF, n + FUTURE_SLICE)))
        if (typeof window.requestIdleCallback === "function") {
            const id = window.requestIdleCallback(next, { timeout: 600 })
            return () => window.cancelIdleCallback(id)
        }
        const id = window.setTimeout(next, 120)
        return () => window.clearTimeout(id)
    }, [growFuture, futureN])

    // Scroll since the stage pinned, in px — measured on through the release
    // until the section's end reaches the top (the stage is gone by then).
    const stageRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
    // px geometry: section and stage height, 1vh, where the exit starts, the
    // release (sticky lets go) and the exit's length.
    const geo = useRef({ H: 0, vh: 1, from: 0, E: 1 })
    const geoTick = useMotionValue(0)
    const [overlap, setOverlap] = useState(0)
    const [geoV, setGeoV] = useState(0)
    useIsoLayoutEffect(() => {
        const sec = sectionRef.current
        const stage = stageRef.current
        if (!sec || !stage) return
        const update = () => {
            const H = sec.offsetHeight
            const vh = window.innerHeight / 100
            const from = EXIT_FROM_VH * vh
            const E = Math.max(1, H - stage.offsetHeight - from)
            geo.current = { H, vh, from, E }
            setOverlap(Math.round(E * RISE_TOTAL))
            geoTick.set(geoTick.get() + 1)
            setGeoV((v) => v + 1)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(sec)
        ro.observe(stage)
        window.addEventListener("resize", update)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [geoTick])
    const scrolled = useTransform([scrollYProgress, geoTick], ([q]: number[]) => q * geo.current.H)

    const triggersRef = useRef<number[]>([])
    const exitOf = (px: number) => (px - geo.current.from) / geo.current.E
    const [panLive, setPanLive] = useState(false)
    const panLiveRef = useRef(false)
    const onScrolled = (px: number) => {
        if (px > 0) player.start()
        const live = px >= geo.current.from - PAN_AHEAD_VH * geo.current.vh
        if (live !== panLiveRef.current) {
            panLiveRef.current = live
            setPanLive(live)
        }
        // The future work comes due as its weeks pass TRIGGER_X in the drift.
        director.setFutureDue(futureDue(PAN_TOTAL * drift(Math.max(0, exitOf(px))), triggersRef.current))
        const dvh = px / geo.current.vh
        // A scroll that's already into the third wave while the floor is still
        // opening plays the rest of the opening quicker, so the tiles aren't held up.
        if (dvh >= WAVE_VH[Math.min(2, WAVE_VH.length - 1)]) player.hurry()
        const n = dueCount(dvh)
        director.setDue(n)
        director.setRush(clamp01((dvh - RUSH_FROM_VH) / (RUSH_FULL_VH - RUSH_FROM_VH)))
        if (n === N0) setGrowFuture(true)
        // Already at the exit (a fast scroll): mount whatever is left now.
        if (dvh >= EXIT_FROM_VH - 10) startTransition(() => setFutureN(NF))
    }
    useMotionValueEvent(scrolled, "change", (px) => {
        if (!reduce) onScrolled(px)
    })
    useEffect(() => {
        if (reduce) {
            player.finish()
            setOpening(false)
            director.placeAll()
            return
        }
        onScrolled(scrolled.get())
        return () => director.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce])

    // Everything scroll-linked is baked: each element's styles are sampled
    // along the scroll into keyframes, which the browser then plays against
    // the scroll itself (lib/scrollScrub) — on the compositor where scroll
    // timelines exist, so nothing runs per scroll frame. Rebuilt on resize.
    // Exit progress u (exitOf): 0 at the start of the exit, 1 at the release,
    // and on beyond it. None of it with reduced motion.
    const surfaceRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const fadeRef = useRef<HTMLDivElement>(null)
    const grainRef = useRef<HTMLDivElement>(null)
    const headingRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const sec = sectionRef.current
        const els = [stageRef.current, fadeRef.current, grainRef.current, headingRef.current]
        if (reduce || !sec || els.some((e) => !e) || geoV === 0) return
        const [stage, fade, grain, heading] = els as HTMLElement[]
        const { H, vh, from, E } = geo.current
        // The stage's rise (locked to the page's scroll), and the soft bottom
        // edge that grows with it: a thin edge as it lifts off, deepening as it
        // climbs, fading in over the first few px. It carries the page's grain
        // so the stage's flat dark meets the textured page without a seam.
        const riseAt = (px: number) => riseOf(exitOf(px)) * E
        const edge = (px: number) => {
            const r = riseAt(px)
            return { scale: Math.min(1, (EDGE_MIN + r * EDGE_GROW) / (EDGE_H * 100 * vh)), near: clamp01(r / 24) }
        }
        const riseFrom = from + RISE_AT * E
        const riseTo = from + E
        // The heading clears left, ahead of the drift, over the first ~30% of
        // the exit.
        return bakeScrub(sec, [
            { el: stage, from: riseFrom, to: riseTo, samples: 60, at: (px) => ({ transform: `translateY(${-riseAt(px)}px)` }) },
            { el: fade, from: riseFrom, to: riseTo, samples: 60, at: (px) => { const e = edge(px); return { transform: `scaleY(${e.scale})`, opacity: e.near } } },
            { el: grain, from: riseFrom, to: riseTo, samples: 60, at: (px) => { const e = edge(px); return { transform: `scaleY(${e.scale})`, opacity: 0.07 * e.near } } },
            {
                el: heading, from, to: from + 0.3 * E, samples: 30,
                at: (px) => { const u = exitOf(px); return { opacity: 1 - clamp01(u / 0.27), transform: `translateX(${-60 * easeIn(clamp01(u / 0.3))}%)` } },
            },
        ], { H, viewport: vh * 100 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce, geoV])
    // The drift pans the floor's surface and the plan. It is only attached
    // around the exit (from PAN_AHEAD_VH before it): an animated surface is a
    // layer of its own, which splits the floor into window, mask and surface
    // layers — three of the floor's size instead of one. Before the exit the
    // pan is zero, so nothing changes on screen.
    useIsoLayoutEffect(() => {
        const sec = sectionRef.current
        const surface = surfaceRef.current
        const sheet = sheetRef.current
        if (reduce || !panLive || !sec || !surface || !sheet || geoV === 0) return
        const { H, vh, from } = geo.current
        const pan = (px: number) => ({ transform: `translateX(${-PAN_TOTAL * drift(Math.max(0, exitOf(px)))}px)` })
        return bakeScrub(sec, [
            { el: surface, from, to: H, samples: 90, at: pan },
            { el: sheet, from, to: H, samples: 90, at: pan },
        ], { H, viewport: vh * 100 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce, geoV, panLive])

    // The heading fades in as the floor settles (headingAt, played with the
    // intro); its clearing is baked above.
    const introHeadingRef = useRef<HTMLDivElement>(null)
    useIsoLayoutEffect(() => {
        player.attach({ heading: introHeadingRef.current })
        return () => player.attach({ heading: null })
    }, [player])

    return (
        // The negative bottom margin lets the next section ride up over the end
        // of this one by exactly the stage's rise (none with reduced motion).
        <section ref={sectionRef} className="relative h-[390vh]" style={{ marginBottom: reduce ? 0 : -overlap }}>
            <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-[#05060e]" style={{ visibility: near ? undefined : "hidden" }}>
                {/* The lit floor stops a few px short of the stage's bottom edge, so
                    that edge is only ever page colour: a scaled or fractional-pixel
                    edge can't blend a bright row into a seam as the stage rises. */}
                <div className="absolute inset-x-0 top-0 bottom-[3px] overflow-hidden">
                    <Stage player={player} opening={opening} director={director} futureN={futureN} panRefs={{ surface: surfaceRef, sheet: sheetRef }} triggersRef={triggersRef} lite={lite} />
                </div>
                <div
                    ref={fadeRef}
                    aria-hidden
                    style={{ opacity: 0, height: `${EDGE_H * 100}%` }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 origin-bottom bg-gradient-to-t from-[#05060e] via-[#05060e]/70 to-transparent"
                />
                <div
                    ref={grainRef}
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 origin-bottom"
                    style={{
                        height: `${EDGE_H * 100}%`,
                        opacity: 0,
                        backgroundImage: GRAIN,
                        backgroundSize: "160px 160px",
                        maskImage: "linear-gradient(to top, #000 30%, transparent)",
                        WebkitMaskImage: "linear-gradient(to top, #000 30%, transparent)",
                    }}
                />

                {/* Heading, over the dark far end of the plane. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-[#05060e] via-[#05060e]/80 to-transparent" />
                <div ref={headingRef} className="absolute inset-x-0 top-0">
                <div ref={introHeadingRef} style={headingAt(0)} className="px-5 pt-24 md:px-12 md:pt-28">
                    <div className="mx-auto grid max-w-[1240px] gap-4 md:grid-cols-[1.15fr_1fr] md:items-end md:gap-16">
                        <div>
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[#e89440] md:mb-4">Plan together</p>
                            <h2 className="text-[clamp(2.1rem,5vw,4rem)] font-bold leading-[1.04] tracking-tight">
                                Everyone sees
                                <br />
                                <Ember>the same plan.</Ember>
                            </h2>
                        </div>
                        <p className="max-w-md text-[15px] leading-relaxed text-[#9ba4c4] md:pb-2 md:text-xl">
                            Drag issues onto a shared timeline. Product, design and engineering follow one view of what is in flight and what lands next.
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </section>
    )
}
