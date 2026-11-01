"use client"

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import {
    animate, motion, motionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform,
    type MotionValue,
} from "framer-motion"
import { GRAIN } from "./AmbientBackground"
import { Brick, brickCard, mix, pastelFor, weekStartMs } from "./app/screens/timeline"
import {
    FLOOR_BOX, PB_CELL, PB_FUTURE, PB_ORIGIN, PB_PLAN, PB_TILES, PB_TODAY_COL, PlayfulFloor, type PlacedTile,
} from "./app/screens/timeline-playful"

// ─── Plan together: the timeline planning tool ──────────────────────────────
// A tall section (390vh) with a pinned, full-bleed stage holding one endless
// timeline floor (./app/screens/timeline-playful) at 60°.
//
//   Intro — time-based, once, when the stage first pins. A small patch of the
//   plan at the centre, a little flatter, bursts outward (expo-out) until the
//   floor fills the screen and runs off into the dark: the camera scales the
//   plane up from the centre and tips it to 60° while cell-stepped rings of
//   floor are uncovered outward and an ember bloom flares and fades. The
//   heading fades in as the floor settles.
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
//   Scrolling back lifts whole waves off in reverse (ease-in up + fade); a
//   tile caught mid-flight just turns around from where it is.
//
//   Exit — scroll-scrubbed, after a short hold on the finished plan: a calm,
//   endless drift. The timeline pans left along its own axis in plane space
//   (a brief ease-in, then a steady conveyor through ~2¾ months): grid,
//   weekend shading, date row, today's column and the plan slide out left
//   under a lit area that stays put, while later dates slide in from the right
//   and more planned work keeps landing on them — each week of it drops in
//   (same gravity) as its first slot passes ~80% across the stage, and lifts
//   off again when scrolled back. Planning goes on forever. The heading clears
//   left early; scrolling back reverses everything.
//
// Runtime: the intro is one framer animation of one clock; the tiles are
// driven by one rAF loop (TileDirector) writing per-tile motion values — no
// React render per frame. Transforms and opacity only; masks are static.
//
// 3D: perspective wrapper (flat, unclipped) → plane root → floor, covers,
// contact shadows (leaves) and tile movers → slab layers + face, preserve-3d
// the whole way; fades sit on leaves only. The stage clips, outside 3D.

const CELL = PB_CELL
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))
const clamp01 = (v: number) => clamp(v, 0, 1)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3)
const expoOut = (v: number) => (v >= 1 ? 1 : 1 - Math.pow(2, -10 * v))

// ════════════════════════════════════════════════════════════════════════════
// Camera
// ════════════════════════════════════════════════════════════════════════════

/** th: tilt (deg) · k: scale · (ax, ay): lattice point held at stage point (sx, sy). */
type Cam = { th: number; k: number; ax: number; ay: number; sx: number; sy: number }
type Rig = { vw: number; P: number; oy: number; c0: Cam; c1: Cam }

const INTRO = 1.6 // s

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
        P: clamp(1350 * k1, 800, 1700),
        oy: vh * 0.1,
        // Intro start: a small patch of the same spot, centred, flatter.
        c0: { ...rest, th: 37, k: k1 * 0.3, sy: vh * 0.56 },
        c1: rest,
    }
}

function camAt(t: number, rig: Rig): string {
    const u = expoOut(clamp01(t / INTRO))
    const { c0, c1 } = rig
    const th = lerp(c0.th, c1.th, u)
    const k = Math.exp(lerp(Math.log(c0.k), Math.log(c1.k), u))
    const ax = lerp(c0.ax, c1.ax, u)
    const ay = lerp(c0.ay, c1.ay, u)
    const sx = lerp(c0.sx, c1.sx, u)
    const sy = lerp(c0.sy, c1.sy, u)
    return `translate(${sx}px, ${sy}px) scale3d(${k}, ${k}, ${k}) rotateX(${th}deg) translate(${-ax}px, ${-ay}px)`
}

const easeIn = (v: number) => v * v * v

/** The exit's drift: PAN_DAYS of timeline (lattice px), the same everywhere. */
const PAN_DAYS = 84
const PAN_TOTAL = PAN_DAYS * CELL
/** Brief ease-in (the first DRIFT_IN of the exit), then a constant speed. */
const DRIFT_IN = 0.15
const drift = (u: number) => {
    const v = 1 / (1 - DRIFT_IN / 2) // the cruising speed that ends exactly at 1
    return u < DRIFT_IN ? (v * u * u) / (2 * DRIFT_IN) : v * (u - DRIFT_IN / 2)
}

// ════════════════════════════════════════════════════════════════════════════
// Intro reveal: cell-stepped rings of floor uncovered outward
// ════════════════════════════════════════════════════════════════════════════

const PAGE = "#05060e"
const PATCH = { x0: -4, y0: -4, x1: 40, y1: 9 } // cells — the plan and its date row
const RING_STEPS = [2, 5, 9, 14, 20, 28] // later holes, in cells past the patch
const RING_AT = (k: number) => 0.04 + 0.075 * k
const RING_DUR = 0.2

type Rect = { x0: number; y0: number; x1: number; y1: number }
const FLOOR_RECT: Rect = { x0: FLOOR_BOX.x, y0: FLOOR_BOX.y, x1: FLOOR_BOX.x + FLOOR_BOX.w, y1: FLOOR_BOX.y + FLOOR_BOX.h }
const HOLES: Rect[] = [0, ...RING_STEPS].map((d) => ({
    x0: (PATCH.x0 - d) * CELL,
    y0: (PATCH.y0 - d) * CELL,
    x1: (PATCH.x1 + d) * CELL,
    y1: (PATCH.y1 + d) * CELL,
}))

/** Four solid strips around a hole, out to the floor's edge. */
function strips(h: Rect, f: Rect) {
    return [
        { left: f.x0, top: f.y0, width: f.x1 - f.x0, height: Math.max(0, h.y0 - f.y0) }, // far
        { left: f.x0, top: h.y1, width: f.x1 - f.x0, height: Math.max(0, f.y1 - h.y1) }, // near
        { left: f.x0, top: h.y0, width: Math.max(0, h.x0 - f.x0), height: h.y1 - h.y0 }, // left
        { left: h.x1, top: h.y0, width: Math.max(0, f.x1 - h.x1), height: h.y1 - h.y0 }, // right
    ]
}

/** Cover k hides the floor outside hole k in the page's colour; covers fade
 *  out in turn, inner first, so the floor grows outward in steps. */
function Cover({ hole, k, intro }: { hole: Rect; k: number; intro: MotionValue<number> }) {
    const opacity = useTransform(intro, (t) => 1 - clamp01((t - RING_AT(k)) / RING_DUR))
    return (
        <>
            {strips(hole, FLOOR_RECT).map((s, i) => (
                <motion.div key={i} className="pointer-events-none absolute" style={{ ...s, background: PAGE, opacity, transform: "translateZ(0.5px)" }} />
            ))}
        </>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Tile physics
// ════════════════════════════════════════════════════════════════════════════

// Tile slab
const DEPTH = 9.5 // px the top face stands off the plane
const LAYERS = [2, 4.5, 7] // z of the stacked edge layers under the face
const LAYER_SHADE = [52, 40, 28] // % of the tile's accent mixed into its pastel (bottom → top)
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
const LIFT = 0.34 // s to lift a resting tile off and fade it out

// Scroll → due tiles; the launch / lift queues.
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
const LIFT_GAP = 0.06 // s between lift-offs (reverse order)
const FRAME_SLACK = 0.008 // half a 60 Hz frame, so a gap isn't rounded up a whole frame

/** z: height above the plane · sxy / sz: in-plane / thickness scale · rx, rz: tilt (deg) · o: opacity */
type Pose = { z: number; sxy: number; sz: number; rx: number; rz: number; o: number }
const REST: Pose = { z: 0, sxy: 1, sz: 1, rx: 0, rz: 0, o: 1 }

type Seg =
    | { kind: "fall"; t0: number; dur: number }
    | { kind: "contact"; t0: number; dur: number; q: number; st: number }
    | { kind: "bounce"; t0: number; dur: number; h: number }

type Drop = { h0: number; o0: number; rx0: number; rz0: number; st: number; segs: Seg[]; land: number; end: number }
type Lift = { from: Pose; to: { z: number; rx: number; rz: number }; dur: number }

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

/** Lift-off: ease-in up to the drop height, tipping into its tumble, fading. */
function liftPose(l: Lift, tau: number): Pose {
    const u = clamp01(tau / l.dur)
    const e = u * u
    return {
        z: lerp(l.from.z, l.to.z, e),
        sxy: lerp(l.from.sxy, 1, u),
        sz: lerp(l.from.sz, 1, u),
        rx: lerp(l.from.rx, l.to.rx, e),
        rz: lerp(l.from.rz, l.to.rz, e),
        o: l.from.o * (1 - u),
    }
}

// All tiles: the plan (0 … N0−1), then the future work (N0 … NT−1).
const TILES: PlacedTile[] = [...PB_TILES, ...PB_FUTURE]
const N0 = PB_TILES.length
const NT = TILES.length
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
    | { mode: "hidden"; pose: Pose }
    | { mode: "rest"; pose: Pose }
    | { mode: "fall"; pose: Pose; t0: number; d: Drop; landed: boolean }
    | { mode: "lift"; pose: Pose; t0: number; l: Lift }

const tfOf = (p: Pose) =>
    p === REST ? "none" : `translateZ(${p.z}px) rotateX(${p.rx}deg) rotateZ(${p.rz}deg) scale3d(${p.sxy}, ${p.sxy}, ${p.sz})`

class TileDirector {
    readonly mvs: TileMVs[]
    readonly pulse = motionValue(PULSE_IDLE)
    private st: TileState[]
    private dueMain = 0 // plan tiles due (scroll waves)
    private dueFuture = 0 // future tiles due (exit drift)
    private ready = false
    private lastLaunch = -Infinity
    private lastLift = -Infinity
    private rush = 0 // 0…1, from the scroll running past the last wave
    private pulseAt: number | null = null
    private raf: number | null = null

    constructor() {
        this.st = TILES.map((_, i) => ({ mode: "hidden", pose: hiddenPose(i) }))
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

    /** How many plan tiles (by rank) the scroll waves say are due. */
    setDue(n: number) {
        if (n === this.dueMain) return
        this.dueMain = n
        this.kick()
    }
    /** How many future tiles (by rank) the exit's drift says are due. */
    setFutureDue(n: number) {
        if (n === this.dueFuture) return
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
        for (let i = 0; i < N0; i++) this.set(i, { mode: "rest", pose: REST })
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

    private set(i: number, s: TileState) {
        this.st[i] = s
        const p = s.pose
        const m = this.mvs[i]
        const near = 1 - clamp01(p.z / PHYS[i].h)
        m.tf.set(tfOf(p))
        m.op.set(p.o)
        m.shTf.set(this.shadowTf(i, p))
        m.shOp.set(SHADOW_REST * near * near * near * Math.min(1, p.o * 1.5))
        m.vis.set(s.mode === "hidden" ? "hidden" : "visible")
    }

    private launch(i: number, t: number, k: number) {
        const cur = this.st[i]
        const ph = PHYS[i]
        // From hidden: a full drop. From a lift: fall from wherever it is.
        const from = cur.mode === "lift" ? cur.pose : hiddenPose(i)
        const d = buildDrop(ph, Math.min(from.z, ph.h), cur.mode === "lift" ? from.o : 0, from.rx, from.rz, k)
        this.set(i, { mode: "fall", pose: dropPose(d, 0), t0: t, d, landed: false })
    }

    private lift(i: number, t: number) {
        const from = this.st[i].pose
        const ph = PHYS[i]
        const dur = LIFT * (0.35 + 0.65 * (1 - clamp01(from.z / ph.h)))
        const l: Lift = { from, to: { z: ph.h, rx: TUMBLE[i].rx, rz: TUMBLE[i].rz }, dur }
        this.set(i, { mode: "lift", pose: liftPose(l, 0), t0: t, l })
    }

    private tick = (now: number) => {
        this.raf = null
        const t = now / 1000
        let busy = false
        let landedNow = false

        // 1. Advance every tile in flight on its own clock.
        for (let i = 0; i < NT; i++) {
            const s = this.st[i]
            if (s.mode === "fall") {
                const tau = t - s.t0
                if (tau >= s.d.end) this.set(i, { mode: "rest", pose: REST })
                else {
                    const landed = s.landed || tau >= s.d.land
                    if (landed && !s.landed && i < N0) landedNow = true
                    this.set(i, { ...s, pose: dropPose(s.d, tau), landed })
                    busy = true
                }
                if (tau >= s.d.end && !s.landed && i < N0) landedNow = true
            } else if (s.mode === "lift") {
                const tau = t - s.t0
                if (tau >= s.l.dur) this.set(i, { mode: "hidden", pose: hiddenPose(i) })
                else {
                    this.set(i, { ...s, pose: liftPose(s.l, tau) })
                    busy = true
                }
            }
        }

        // 2. Today pulses each time the plan's last tile lands.
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

        // 3. Dispatch: lift off what is no longer due (reverse order), launch
        //    what is (in order), each queue with its own minimum gap.
        let pending = false
        if (this.ready) {
            const due = this.due
            for (let r = NT - 1; r >= due; r--) {
                const i = RANKED[r]
                const m = this.st[i].mode
                if (m === "fall" || m === "rest") {
                    pending = true
                    if (t - this.lastLift >= LIFT_GAP - FRAME_SLACK) {
                        this.lift(i, t)
                        this.lastLift = t
                        busy = true
                    }
                    break
                }
            }
            let backlog = 0
            let planBehind = false
            for (let r = 0; r < due; r++) {
                const m = this.st[RANKED[r]].mode
                if (m === "hidden" || m === "lift") {
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
                if (m === "hidden" || m === "lift") {
                    this.launch(i, t, k)
                    this.lastLaunch = t
                    budget--
                    busy = true
                }
            }
            if (backlog > 0) pending = true
        }

        if (busy || pending) this.kick()
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Pieces
// ════════════════════════════════════════════════════════════════════════════

const P3D = { transformStyle: "preserve-3d" } as const

function DropTile({ tile, mv }: { tile: PlacedTile; mv: TileMVs }) {
    const card = brickCard(tile, CELL)
    const { bg, fg } = pastelFor(tile.issue.id)
    const cardBox = { left: card.left, top: card.top, width: card.width, height: card.height, borderRadius: card.radius }
    return (
        <>
            {/* Contact shadow: lies on the plane; faint and small while the tile
                is high, growing and darkening as it comes down. */}
            <motion.div
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
                {LAYERS.map((z, k) => (
                    <motion.div
                        key={z}
                        className="absolute"
                        style={{ ...cardBox, background: `color-mix(in srgb, ${fg} ${LAYER_SHADE[k]}%, ${bg})`, transform: `translateZ(${z}px)`, opacity: mv.op }}
                    />
                ))}
                {/* Top face — the real tile, exactly. */}
                <motion.div className="absolute inset-0" style={{ transform: `translateZ(${DEPTH}px)`, opacity: mv.op }}>
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

/** Ember bloom from the centre as the floor opens (screen space, over it). */
function Bloom({ intro }: { intro: MotionValue<number> }) {
    const scale = useTransform(intro, (t) => 0.35 + 2.2 * expoOut(clamp01(t / INTRO)))
    const opacity = useTransform(intro, (t) => {
        if (t <= 0) return 0
        const u = t / 1.25
        return u < 0.1 ? u / 0.1 : 1 - easeOut(clamp01((u - 0.1) / 0.9))
    })
    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[56%] h-[90vmax] w-[90vmax] rounded-full"
            style={{
                x: "-50%",
                y: "-50%",
                scale,
                opacity,
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
    intro, exit, director, future,
}: {
    intro: MotionValue<number>
    exit: MotionValue<number>
    director: TileDirector
    /** Mount the future work (from the hold on — it costs nothing before). */
    future: boolean
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [rig, setRig] = useState<Rig | null>(null)
    const rigRef = useRef<Rig | null>(null)
    const triggersRef = useRef<number[]>([])
    const resized = useMotionValue(0)
    useIsoLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => {
            const r = rigFor(el.clientWidth, el.clientHeight)
            rigRef.current = r
            triggersRef.current = futureTriggers(r)
            setRig(r)
            resized.set(resized.get() + 1)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [resized])

    const camera = useTransform([intro, resized], ([t]: number[]) => (rigRef.current ? camAt(t, rigRef.current) : "none"))
    // The covers and bloom are spent once the floor is out — drop them then.
    const [opening, setOpening] = useState(true)
    useMotionValueEvent(intro, "change", (t) => {
        if (t >= INTRO) setOpening(false)
    })
    // Exit: the timeline drifts left along its own X axis, inside the tilt —
    // on past the release until the stage has left the screen; the future work
    // comes due as its weeks pass TRIGGER_X.
    const pan = useTransform(exit, (u) => -PAN_TOTAL * drift(Math.max(0, u)))
    useMotionValueEvent(pan, "change", (x) => director.setFutureDue(futureDue(-x, triggersRef.current)))
    const [exiting, setExiting] = useState(false)
    useMotionValueEvent(exit, "change", (u) => setExiting(u > 0))

    return (
        <div ref={ref} className="absolute inset-0" style={{ visibility: rig ? undefined : "hidden" }}>
            {/* Perspective wrapper — flat, unclipped. */}
            <div className="absolute inset-0" style={{ perspective: rig?.P ?? 1200, perspectiveOrigin: `50% ${rig?.oy ?? 0}px` }}>
                {/* The plane: lattice (0, 0) = day 0 · lane 0. */}
                <motion.div
                    className="absolute left-0 top-0"
                    style={{ ...P3D, transform: camera, transformOrigin: "0 0", willChange: opening ? "transform" : undefined }}
                >
                    {/* The floor: its lit window stays put; its surface (grid, weekend
                        shading, today's column, date row) pans with the tiles, so an
                        endless timeline slides by under a fixed light. */}
                    <PlayfulFloor
                        wrapToday={(pill) => <TodayPill pulse={director.pulse}>{pill}</TodayPill>}
                        surfaceStyle={{ x: pan, willChange: exiting ? "transform" : undefined }}
                    />
                    {/* Everything else on the plane, panned with it as one rigid sheet. */}
                    <motion.div className="absolute left-0 top-0" style={{ ...P3D, x: pan, willChange: exiting ? "transform" : undefined }}>
                        <TodayFlash pulse={director.pulse} />
                        {opening && HOLES.map((hole, k) => <Cover key={k} hole={hole} k={k} intro={intro} />)}
                        {TILES.map((tile, i) =>
                            i < N0 || future ? (
                                <Fragment key={tile.issue.id}>
                                    <DropTile tile={tile} mv={director.mvs[i]} />
                                </Fragment>
                            ) : null,
                        )}
                    </motion.div>
                </motion.div>
            </div>
            {opening && <Bloom intro={intro} />}
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
    const intro = useMotionValue(0)
    const [director] = useState(() => new TileDirector())
    const reduce = useReducedMotion()
    const introStarted = useRef(false)
    const [future, setFuture] = useState(false)

    // Scroll since the stage pinned, in px — measured on through the release
    // until the section's end reaches the top (the stage is gone by then).
    const stageRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
    // px geometry: section and stage height, 1vh, where the exit starts, the
    // release (sticky lets go) and the exit's length.
    const geo = useRef({ H: 0, vh: 1, from: 0, E: 1 })
    const geoTick = useMotionValue(0)
    const [overlap, setOverlap] = useState(0)
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

    // The intro plays once, time-based, the first time the stage pins; scroll
    // never drives it and it never replays.
    // A scroll that's already into the third wave while the floor is still
    // opening plays the rest of the opening quicker, so the tiles aren't held up.
    const introAnim = useRef<ReturnType<typeof animate> | null>(null)
    const introHurried = useRef(false)
    const startIntro = () => {
        if (introStarted.current) return
        introStarted.current = true
        introAnim.current = animate(intro, INTRO, { duration: INTRO, ease: "linear", onComplete: () => director.setReady() })
    }
    const hurryIntro = () => {
        const left = INTRO - intro.get()
        if (introHurried.current || !introAnim.current || left <= 0) return
        introHurried.current = true
        introAnim.current.stop()
        introAnim.current = animate(intro, INTRO, { duration: Math.max(0.3, left * 0.35), ease: "linear", onComplete: () => director.setReady() })
    }
    const onScrolled = (px: number) => {
        if (px > 0) startIntro()
        const dvh = px / geo.current.vh
        if (dvh >= WAVE_VH[Math.min(2, WAVE_VH.length - 1)]) hurryIntro()
        const n = dueCount(dvh)
        director.setDue(n)
        director.setRush(clamp01((dvh - RUSH_FROM_VH) / (RUSH_FULL_VH - RUSH_FROM_VH)))
        if (n === N0) setFuture(true)
    }
    useMotionValueEvent(scrolled, "change", (px) => {
        if (!reduce) onScrolled(px)
    })
    useEffect(() => {
        if (reduce) {
            intro.set(INTRO)
            director.placeAll()
            return
        }
        onScrolled(scrolled.get())
        return () => director.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce])

    // Exit progress u: 0 at the start of the exit, 1 at the release, and on
    // beyond it. The drift reads it through a light spring so trackpad steps
    // don't judder; the rise reads it raw, locked to the page's own scroll.
    // None of it when reduced motion is on.
    const still = useMotionValue(0)
    useEffect(() => still.set(reduce ? 1 : 0), [reduce, still])
    const exitOf = (px: number) => (px - geo.current.from) / geo.current.E
    const smooth = useSpring(scrolled, { stiffness: 260, damping: 36, mass: 0.5, restDelta: 0.01 })
    const exit = useTransform([smooth, still, geoTick], ([px, r]: number[]) => (r ? 0 : Math.max(0, exitOf(px))))
    const exitRaw = useTransform([scrolled, still, geoTick], ([px, r]: number[]) => (r ? 0 : exitOf(px)))
    // Whole pixels, so the stage's clipped bottom edge and its fade line up exactly.
    const rise = useTransform(exitRaw, (u) => -Math.round(riseOf(u) * geo.current.E))

    // The heading fades in as the floor settles and clears left, ahead of the
    // drift, over the first ~30% of the exit.
    const headingOpacity = useTransform([intro, exit], ([t, u]: number[]) => Math.min(clamp01((t - 0.85) / 0.65), 1 - clamp01(u / 0.27)))
    const headingY = useTransform(intro, [0.85, 1.5], [18, 0])
    const headingX = useTransform(exit, (u) => `${-60 * easeIn(clamp01(u / 0.3))}%`)
    // As the stage rises its bottom melts into the page, so it never shows a
    // bright edge above the page (and the next section). The fade grows with
    // the rise itself: a thin soft edge as it lifts off, deepening as it climbs
    // (scaleY from the bottom, never a sudden band); it fades in over the first
    // few px of rise.
    const fadeScale = useTransform(rise, (y) => Math.min(1, (EDGE_MIN + -y * EDGE_GROW) / (EDGE_H * 100 * geo.current.vh)))
    const nearFade = useTransform(rise, [0, -24], [0, 1])
    // …and carries the page's grain (AmbientBackground) at its edge, so the
    // stage's flat dark meets the textured page below without a seam.
    const edgeGrain = useTransform(nearFade, (o) => 0.07 * o)

    return (
        // The negative bottom margin lets the next section ride up over the end
        // of this one by exactly the stage's rise (none with reduced motion).
        <section ref={sectionRef} className="relative h-[390vh]" style={{ marginBottom: reduce ? 0 : -overlap }}>
            <motion.div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-[#05060e]" style={{ y: rise }}>
                {/* The lit floor stops a few px short of the stage's bottom edge, so
                    that edge is only ever page colour: a scaled or fractional-pixel
                    edge can't blend a bright row into a seam as the stage rises. */}
                <div className="absolute inset-x-0 top-0 bottom-[3px] overflow-hidden">
                    <Stage intro={intro} exit={exit} director={director} future={future} />
                </div>
                <motion.div
                    aria-hidden
                    style={{ opacity: nearFade, scaleY: fadeScale, height: `${EDGE_H * 100}%` }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 origin-bottom bg-gradient-to-t from-[#05060e] via-[#05060e]/70 to-transparent"
                />
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 origin-bottom"
                    style={{
                        height: `${EDGE_H * 100}%`,
                        scaleY: fadeScale,
                        opacity: edgeGrain,
                        backgroundImage: GRAIN,
                        backgroundSize: "160px 160px",
                        maskImage: "linear-gradient(to top, #000 30%, transparent)",
                        WebkitMaskImage: "linear-gradient(to top, #000 30%, transparent)",
                    }}
                />

                {/* Heading, over the dark far end of the plane. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-[#05060e] via-[#05060e]/80 to-transparent" />
                <motion.div
                    style={{ opacity: headingOpacity, x: headingX, y: headingY }}
                    className="absolute inset-x-0 top-0 px-5 pt-24 md:px-12 md:pt-28"
                >
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
                </motion.div>
            </motion.div>
        </section>
    )
}
