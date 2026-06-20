"use client"

import { CheckIcon, ChevronUpDownIcon, LockClosedIcon } from "@heroicons/react/24/solid"

// ── App config panel ─────────────────────────────────────────────────────────
//
// Step 04's visual: managing everything from the Bobby app once you're live —
// runners, concurrency, region, auto-deploy, secrets. A calm, realistic settings
// surface (the config you wrote in steps 1–3, now editable in one place) rather
// than an abstract diagram. Static UI, so it costs nothing to render.

const BOBBY_PATH =
  "M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"

function Toggle({ on }: { on?: boolean }) {
  return (
    <span className={`relative inline-flex h-5 w-[34px] flex-none rounded-full transition-colors ${on ? "bg-primary" : "bg-gray-300 dark:bg-white/20"}`}>
      <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[16px]" : "left-[2px]"}`} />
    </span>
  )
}

function SelectPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[13px] font-medium text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200">
      {children}
      <ChevronUpDownIcon className="h-3.5 w-3.5 text-gray-400" />
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </div>
  )
}

export default function ConfigPanel() {
  return (
    <div className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_60px_-30px_rgba(16,24,40,0.4)] dark:border-white/[0.08] dark:bg-[#15151a]">
      {/* window header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-primary">
            <svg viewBox="0 0 106 102" className="h-3.5 w-3.5" aria-hidden="true"><path fill="#111111" d={BOBBY_PATH} /></svg>
          </span>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">acme / web</span>
          <span className="text-[12px] text-gray-400">Configuration</span>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:bg-green-500/[0.12] dark:text-green-400">
          <CheckIcon className="h-3 w-3" /> Saved
        </span>
      </div>

      {/* settings */}
      <div className="flex flex-col gap-3.5 p-4">
        <Row label="Runner"><SelectPill>Self-hosted</SelectPill></Row>
        <Row label="Auto-deploy on push"><Toggle on /></Row>

        {/* secrets */}
        <div className="mt-1 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <LockClosedIcon className="h-3 w-3" /> Secrets
          </div>
          {[
            ["DATABASE_URL", "postgres://••••••••••"],
            ["API_KEY", "sk_live_••••••••"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 font-mono text-[12px]">
              <span className="text-gray-500 dark:text-gray-400">{k}</span>
              <span className="text-gray-400 dark:text-gray-500">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
