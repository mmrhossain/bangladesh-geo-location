"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { useDatasetMeta, useReadiness } from "@/hooks/use-dataset";
import { formatDateTime, formatNumber } from "@/lib/format";
import { RESOURCES } from "@/lib/resources";
import type {
    DatasetCounts,
    DatasetMeta,
    ReadinessResponse,
} from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { ErrorBlock } from "@/components/states";
import {
    ArrowRightIcon,
    ChevronRightIcon,
    DatasetIcon,
    ExploreIcon,
    HierarchyIcon,
    MapPinIcon,
    OverviewIcon,
    RefreshIcon,
    SearchIcon,
} from "@/components/icons";

const EMPTY_COUNTS: DatasetCounts = {
    divisions: 0,
    districts: 0,
    upazilas: 0,
    unions: 0,
    postOffices: 0,
};

const STAT_ICONS: Record<
    keyof DatasetCounts,
    ComponentType<SVGProps<SVGSVGElement>>
> = {
    divisions: MapPinIcon,
    districts: HierarchyIcon,
    upazilas: OverviewIcon,
    unions: ExploreIcon,
    postOffices: DatasetIcon,
};

const QUICK_LINKS = [
    {
        href: "/explore",
        title: "Browse records",
        description: "Filter and page through every administrative level.",
        icon: ExploreIcon,
    },
    {
        href: "/search",
        title: "Search places",
        description: "Find entities by English or Bangla name and aliases.",
        icon: SearchIcon,
    },
    {
        href: "/hierarchy",
        title: "Walk the tree",
        description: "Expand divisions down to unions in one view.",
        icon: HierarchyIcon,
    },
    {
        href: "/dataset",
        title: "Dataset and API",
        description: "Check dataset versions and request examples.",
        icon: DatasetIcon,
    },
];

export function OverviewView({
    initialMeta = null,
    initialReadiness = null,
}: {
    initialMeta?: DatasetMeta | null;
    initialReadiness?: ReadinessResponse | null;
}) {
    const metaState = useDatasetMeta(initialMeta);
    const readinessState = useReadiness(initialReadiness);

    const meta = metaState.data;
    const readiness = readinessState.data;
    const counts = meta?.counts ?? readiness?.snapshot.counts ?? EMPTY_COUNTS;
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const isLoading =
        (metaState.loading || readinessState.loading) && total === 0;
    const error = metaState.error ?? readinessState.error;
    const ready =
        readiness?.status === "ready" && readiness.snapshot.ready === true;

    const refreshAll = () => {
        metaState.reload();
        readinessState.reload();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Operations"
                title="Dataset overview"
                description="A live snapshot of the Bangladesh administrative geography service. Reads are served from memory; writes require an admin key."
                actions={
                    <>
                        <Button
                            onClick={refreshAll}
                            disabled={metaState.loading || readinessState.loading}
                        >
                            <RefreshIcon
                                className={`h-4 w-4 ${
                                    metaState.loading || readinessState.loading
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />
                            Refresh
                        </Button>
                        <Link
                            href="/explore"
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:border-emerald-700 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                            Open explorer
                            <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </>
                }
            />

            {error && total === 0 ? (
                <Panel>
                    <ErrorBlock message={error} onRetry={refreshAll} />
                </Panel>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {RESOURCES.map((resource) => (
                    <StatCard
                        key={resource.value}
                        label={resource.label}
                        value={counts[resource.countKey]}
                        hint={
                            resource.value === "post-offices" &&
                            counts.postOffices === 0
                                ? "Not included in this snapshot"
                                : undefined
                        }
                        icon={STAT_ICONS[resource.countKey]}
                        loading={isLoading}
                    />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Panel className="lg:col-span-2">
                    <PanelHeader
                        title="Service health"
                        description="Readiness is derived from the in-memory snapshot."
                        action={
                            <Badge
                                tone={
                                    ready
                                        ? "success"
                                        : readiness
                                          ? "warning"
                                          : "neutral"
                                }
                            >
                                {ready
                                    ? "Ready"
                                    : readiness
                                      ? "Degraded"
                                      : isLoading
                                        ? "Checking"
                                        : "Unknown"}
                            </Badge>
                        }
                    />
                    <div className="divide-y divide-slate-100">
                        <HealthRow
                            label="API"
                            value={
                                readinessState.error
                                    ? "Unreachable"
                                    : readiness
                                      ? "Online"
                                      : isLoading
                                        ? "Checking..."
                                        : "Unknown"
                            }
                            tone={
                                readinessState.error
                                    ? "danger"
                                    : readiness
                                      ? "success"
                                      : "neutral"
                            }
                        />
                        <HealthRow
                            label="Snapshot loaded"
                            value={
                                readiness
                                    ? readiness.snapshot.ready
                                        ? "Yes"
                                        : "No"
                                    : "Unknown"
                            }
                            tone={
                                readiness
                                    ? readiness.snapshot.ready
                                        ? "success"
                                        : "warning"
                                    : "neutral"
                            }
                        />
                        <HealthRow
                            label="Records"
                            value={formatNumber(total)}
                        />
                        <HealthRow
                            label="Snapshot version"
                            value={
                                readiness?.snapshot.datasetVersion ?? "Unknown"
                            }
                        />
                        <HealthRow
                            label="Loaded at"
                            value={formatDateTime(readiness?.snapshot.loadedAt)}
                        />
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Snapshot composition"
                        description="Share of records by level."
                    />
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                        {RESOURCES.map((resource) => {
                            const count = counts[resource.countKey];
                            const share =
                                total === 0 ? 0 : (count / total) * 100;
                            return (
                                <div key={resource.value}>
                                    <div className="flex items-baseline justify-between gap-2 text-xs">
                                        <span className="font-medium text-slate-700">
                                            {resource.label}
                                        </span>
                                        <span className="text-slate-500">
                                            {formatNumber(count)} (
                                            {share.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${share}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        <p className="pt-1 text-xs leading-5 text-slate-500">
                            Post offices are optional and may not be part of the
                            bundled dataset.
                        </p>
                    </div>
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                    <PanelHeader
                        title="Snapshot"
                        description="Dataset version and load status."
                        action={
                            <Link
                                href="/dataset"
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                            >
                                Details
                                <ChevronRightIcon className="h-3.5 w-3.5" />
                            </Link>
                        }
                    />
                    <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Dataset version</span>
                            <code className="text-right text-xs text-slate-800">
                                {meta?.datasetVersion ?? "Unknown"}
                            </code>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Imported</span>
                            <span className="text-right text-slate-800">
                                {formatDateTime(meta?.importedAt)}
                            </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Loaded</span>
                            <span className="text-right text-slate-800">
                                {formatDateTime(meta?.loadedAt)}
                            </span>
                        </div>
                        {meta?.note ? (
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                                {meta.note}
                            </p>
                        ) : null}
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Jump to"
                        description="Common tasks for operators and integrators."
                    />
                    <div className="grid gap-2 px-3 py-3 sm:grid-cols-2 sm:px-4">
                        {QUICK_LINKS.map((link) => {
                            const LinkIcon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group rounded-xl border border-slate-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                >
                                    <LinkIcon className="h-4 w-4 text-emerald-700" />
                                    <p className="mt-2 text-sm font-medium text-slate-900">
                                        {link.title}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                        {link.description}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function HealthRow({
    label,
    value,
    tone = "neutral",
}: {
    label: string;
    value: string;
    tone?: "neutral" | "success" | "warning" | "danger";
}) {
    const dot =
        tone === "success"
            ? "bg-emerald-500"
            : tone === "warning"
              ? "bg-amber-500"
              : tone === "danger"
                ? "bg-rose-500"
                : "bg-slate-300";

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="inline-flex items-center gap-1.5 text-right text-sm font-medium text-slate-900">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {value}
            </span>
        </div>
    );
}
