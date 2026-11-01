import { CheckIcon, CursorArrowRaysIcon } from "@heroicons/react/24/solid"

// ── Product card graphics ───────────────────────────────────────────────────
// Light "UI screenshot" scenes with fixed colours, so they read on white and
// dark cards alike. Each product gets its own accent — independent of the
// brand yellow.

function UcelotArt() {
  return (
    <div className="w-[160px] rounded-xl border border-gray-200 bg-white p-2.5 text-left shadow-[0_12px_26px_-16px_rgba(16,24,40,0.3)]">
      <div className="mb-2 rounded-md bg-gray-50 px-2 py-1.5 text-[9px] font-medium text-gray-600">
        Where do we refresh sessions?
      </div>
      <div className="space-y-1 px-0.5">
        <div className="h-1.5 w-full rounded-full bg-gray-200" />
        <div className="h-1.5 w-[82%] rounded-full bg-gray-200" />
        <div className="h-1.5 w-[64%] rounded-full bg-gray-200" />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        <span className="rounded-md bg-green-600/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-green-700">auth/session.ts:42</span>
        <span className="rounded-md bg-green-600/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-green-700">spec.pdf · p3</span>
      </div>
    </div>
  )
}

function ZooArt() {
  return (
    <div className="relative h-28 w-[156px]">
      <svg viewBox="0 0 156 112" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <path d="M58 30 C 84 30, 76 64, 100 64" fill="none" stroke="#8b5cf6" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="58" cy="30" r="2.6" fill="#8b5cf6" />
        <circle cx="100" cy="64" r="2.6" fill="#8b5cf6" />
      </svg>
      <div className="absolute left-0 top-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 font-mono text-[9px] text-gray-600 shadow-[0_4px_10px_-6px_rgba(16,24,40,0.25)]">
        <span className="text-violet-500">{"{ }"}</span> user
      </div>
      <div className="absolute right-0 top-[50px] w-[58px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-[0_4px_10px_-6px_rgba(16,24,40,0.25)]">
        <div className="mb-1 font-mono text-[7px] text-gray-400">&lt;Card /&gt;</div>
        <div className="flex items-center gap-1">
          <span className="h-3.5 w-3.5 rounded-full bg-violet-200" />
          <span className="h-1.5 flex-1 rounded-full bg-gray-200" />
        </div>
      </div>
      <CursorArrowRaysIcon className="absolute left-[72px] top-[38px] h-4 w-4 text-gray-900" />
    </div>
  )
}

function ConversationArt() {
  return (
    <div className="flex w-[160px] flex-col gap-1.5">
      <div className="ml-auto max-w-[78%] rounded-xl rounded-br-[4px] bg-gray-100 px-2.5 py-1.5 text-[9px] text-gray-700 shadow-[0_4px_10px_-8px_rgba(16,24,40,0.3)]">
        Can you help me plan tomorrow?
      </div>
      <div className="max-w-[78%] rounded-xl rounded-bl-[4px] bg-blue-600 px-2.5 py-1.5 text-[9px] text-white shadow-[0_6px_14px_-8px_rgba(37,99,235,0.6)]">
        Sure, let&apos;s start with your first meeting.
      </div>
      <div className="flex w-fit items-center gap-1 rounded-xl rounded-bl-[4px] border border-gray-200 bg-white px-2.5 py-2">
        <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500 [animation-delay:150ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500 [animation-delay:300ms]" />
      </div>
    </div>
  )
}

function CIArt() {
  return (
    <div className="w-[155px] rounded-xl border border-gray-200 bg-white p-3 text-left shadow-[0_12px_26px_-16px_rgba(16,24,40,0.3)]">
      <div className="mb-2.5 flex gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
      </div>
      <div className="font-mono text-xs text-gray-700"><span className="text-amber-600">$</span> bobby&nbsp;up</div>
      <div className="my-2.5 h-px bg-gray-100" />
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white shadow-[0_0_0_4px_rgba(22,163,74,0.14)]">
          <CheckIcon className="h-2.5 w-2.5" />
        </span>
        <span className="text-[11px] font-semibold text-green-600">Live</span>
      </div>
    </div>
  )
}

const ARTS: Record<string, React.ComponentType> = {
  "ucelot": UcelotArt,
  "component-zoo": ZooArt,
  "conversation-engine": ConversationArt,
  "bobby-ci": CIArt,
}

export default function ProductArt({ slug }: { slug: string }) {
  const Art = ARTS[slug]
  return Art ? <Art /> : null
}
