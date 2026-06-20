"use client"

import { useEffect, useState } from "react"
import { ArrowTopRightOnSquareIcon, BoltIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { getRepo } from "@/lib/api"

const TRACKER_URL = (process.env.NEXT_PUBLIC_TRACKER_URL || "").replace(/\/+$/, "")

interface TrackerProjectRow {
    id: string
    name: string
    repo_url: string
    repo_full_name: string | null
    updated_at: string
}

type Status =
    | { kind: "loading" }
    | { kind: "missing_url" }
    | { kind: "missing_repo" }
    | { kind: "disabled"; repoFullName: string; repoName: string; repoUrl: string }
    | { kind: "enabled";  trackerProject: TrackerProjectRow }
    | { kind: "error";    message: string }

// TrackerIntegrationCard checks whether the current user has a bobby-tracker
// project bound to this CI project's repo, and offers Enable / Open. Reads
// straight from `tracker.projects` over the shared Supabase project — no
// service edits needed (RLS keeps cross-user access blocked).
export function TrackerIntegrationCard({ projectId }: { projectId: string }) {
    const { token, user } = useAuth()
    const [status, setStatus] = useState<Status>({ kind: "loading" })
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function load() {
            if (!TRACKER_URL) {
                if (!cancelled) setStatus({ kind: "missing_url" })
                return
            }
            try {
                const repo = await getRepo(projectId, token)
                if (!repo.repo_full_name) {
                    if (!cancelled) setStatus({ kind: "missing_repo" })
                    return
                }
                const repoUrl = `https://github.com/${repo.repo_full_name}`
                const supabase = createClient()
                const { data, error } = await supabase
                    .schema("tracker")
                    .from("projects")
                    .select("id,name,repo_url,repo_full_name,updated_at")
                    .eq("user_id", user.id)
                    .eq("repo_url", repoUrl)
                    .maybeSingle<TrackerProjectRow>()
                if (cancelled) return
                if (error) {
                    setStatus({ kind: "error", message: error.message })
                    return
                }
                if (data) {
                    setStatus({ kind: "enabled", trackerProject: data })
                } else {
                    setStatus({
                        kind: "disabled",
                        repoFullName: repo.repo_full_name,
                        repoName: repo.repo_name,
                        repoUrl,
                    })
                }
            } catch (e) {
                if (!cancelled) setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) })
            }
        }
        load()
        return () => { cancelled = true }
    }, [projectId, token, user.id])

    async function enable() {
        if (status.kind !== "disabled") return
        setBusy(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .schema("tracker")
            .from("projects")
            .insert({
                user_id: user.id,
                name: status.repoName,
                repo_url: status.repoUrl,
                repo_full_name: status.repoFullName,
            })
            .select("id,name,repo_url,repo_full_name,updated_at")
            .single<TrackerProjectRow>()
        setBusy(false)
        if (error || !data) {
            setStatus({ kind: "error", message: error?.message ?? "failed to create tracker project" })
            return
        }
        setStatus({ kind: "enabled", trackerProject: data })
        window.open(`${TRACKER_URL}/projects/${data.id}/issues`, "_blank", "noopener,noreferrer")
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <BoltIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Bobby Tracker</h3>
                            <StatusPill status={status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Smart issue tracker. Enable to manage issues for this repo and unlock analyser-powered file/line suggestions on each issue.
                        </p>
                    </div>
                </div>
                <Action status={status} busy={busy} onEnable={enable} />
            </div>

            {status.kind === "missing_url" && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Set <code className="font-mono">NEXT_PUBLIC_TRACKER_URL</code> in this app&apos;s env to enable the integration.
                </p>
            )}
            {status.kind === "missing_repo" && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    This project isn&apos;t linked to a GitHub repo yet. Connect a repo in <strong>Configuration</strong> first.
                </p>
            )}
            {status.kind === "error" && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{status.message}</p>
            )}
        </div>
    )
}

function StatusPill({ status }: { status: Status }) {
    if (status.kind === "loading")     return <Pill className="bg-gray-100 text-gray-600">Checking…</Pill>
    if (status.kind === "enabled")     return <Pill className="bg-green-100 text-green-800"><CheckCircleIcon className="h-3.5 w-3.5" />Enabled</Pill>
    if (status.kind === "missing_url" || status.kind === "missing_repo" || status.kind === "error")
        return <Pill className="bg-amber-100 text-amber-800"><ExclamationCircleIcon className="h-3.5 w-3.5" />Unavailable</Pill>
    return <Pill className="bg-gray-100 text-gray-600">Disabled</Pill>
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${className}`}>
            {children}
        </span>
    )
}

function Action({ status, busy, onEnable }: { status: Status; busy: boolean; onEnable: () => void }) {
    if (status.kind === "loading" || status.kind === "missing_url" || status.kind === "missing_repo" || status.kind === "error") {
        return null
    }
    if (status.kind === "enabled") {
        return (
            <a
                href={`${TRACKER_URL}/projects/${status.trackerProject.id}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
                Open in Tracker
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
        )
    }
    return (
        <button
            onClick={onEnable}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
            {busy ? "Enabling…" : "Enable"}
        </button>
    )
}
