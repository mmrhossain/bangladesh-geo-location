"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDatasetMeta } from "@/hooks/use-dataset";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { DatasetMeta } from "@/lib/types";
import { RESOURCES } from "@/lib/resources";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/badge";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/states";
import {
    ArrowRightIcon,
} from "@/components/icons";

const ENDPOINTS = [
    {
        method: "GET",
        path: "/api/v1/divisions",
        description: "Paginated divisions, sorted by name.",
    },
    {
        method: "GET",
        path: "/api/v1/districts",
        description: "Districts with optional cursor pagination.",
    },
    {
        method: "GET",
        path: "/api/v1/upazilas",
        description: "Upazilas and thanas under each district.",
    },
    {
        method: "GET",
        path: "/api/v1/unions",
        description: "Unions under each upazila.",
    },
    {
        method: "GET",
        path: "/api/v1/post-offices",
        description: "Postal offices, when present in the dataset.",
    },
    {
        method: "GET",
        path: "/api/v1/:resource/:code",
        description: "Resolve a single record by its stable code.",
    },
    {
        method: "GET",
        path: "/api/v1/search?q=…&type=…",
        description: "Search names, aliases and codes.",
    },
    {
        method: "GET",
        path: "/api/v1/hierarchy?depth=2",
        description: "Nested tree from divisions down to unions.",
    },
    {
        method: "GET",
        path: "/api/v1/meta/dataset",
        description: "Dataset version, counts and import status.",
    },
    {
        method: "GET",
        path: "/api/v1/openapi.json",
        description: "Machine-readable OpenAPI document.",
    },
];

const CURL_EXAMPLE = `API_URL="http://localhost:4000"

curl "$API_URL/api/v1/divisions?limit=5"
curl "$API_URL/api/v1/search?q=dhaka&type=district"
curl "$API_URL/api/v1/hierarchy?depth=3"
curl "$API_URL/api/v1/meta/dataset"`;

const RESPONSE_EXAMPLE = `{
  "status": "success",
  "data": [
    {
      "code": "D-13",
      "name": "Dhaka",
      "bn_name": "ঢাকা",
      "divisionCode": "BD-13",
      "deprecated_at": null
    }
  ],
  "meta": {
    "limit": 5,
    "hasMore": true,
    "nextCursor": "eyJ..."
  }
}`;

export function DatasetView({
    initialMeta = null,
}: {
    initialMeta?: DatasetMeta | null;
}) {
    const { data, loading, error, reload } = useDatasetMeta(initialMeta);

    const counts = data?.counts;
    const total = counts
        ? Object.values(counts).reduce((sum, value) => sum + value, 0)
        : 0;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Metadata"
                title="Dataset and API"
                description="Version, counts and import status for the active snapshot, plus the endpoints used by this console."
            />

            {loading && !data ? (
                <Panel>
                    <LoadingBlock label="Loading dataset metadata" />
                </Panel>
            ) : error && !data ? (
                <Panel>
                    <ErrorBlock message={error} onRetry={reload} />
                </Panel>
            ) : !data ? (
                <Panel>
                    <EmptyState
                        title="No dataset metadata"
                        description="The API returned an empty metadata document."
                    />
                </Panel>
            ) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Panel className="lg:col-span-2">
                            <PanelHeader
                                title="Snapshot"
                                description="Import metadata stored alongside the dataset."
                                action={
                                    <Badge tone="success">
                                        {data.datasetVersion}
                                    </Badge>
                                }
                            />
                            <div className="divide-y divide-slate-100">
                                <MetaRow label="Imported">
                                    {formatDateTime(data.importedAt)}
                                </MetaRow>
                                <MetaRow label="Loaded into memory">
                                    {formatDateTime(data.loadedAt)}
                                </MetaRow>
                                <MetaRow label="Snapshot version">
                                    <code>{data.datasetVersion}</code>
                                </MetaRow>
                                {data.note ? (
                                    <div className="px-4 py-3 sm:px-5">
                                        <p className="text-xs font-medium text-slate-500">
                                            Note
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-slate-700">
                                            {data.note}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </Panel>

                        <Panel>
                            <PanelHeader
                                title="Record counts"
                                description="Current snapshot composition."
                                action={
                                    <span className="text-xs text-slate-500">
                                        {formatNumber(total)} total
                                    </span>
                                }
                            />
                            <dl className="divide-y divide-slate-100">
                                {RESOURCES.map((resource) => (
                                    <div
                                        key={resource.value}
                                        className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5"
                                    >
                                        <dt className="text-sm text-slate-600">
                                            {resource.label}
                                        </dt>
                                        <dd className="text-sm font-medium text-slate-900">
                                            {formatNumber(
                                                counts?.[resource.countKey],
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    Import or maintain data
                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </Panel>
                    </div>

                    <Panel>
                        <PanelHeader
                            title="API surface"
                            description="The console talks to these endpoints through a same-origin Next.js rewrite."
                        />
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        <th className="px-4 py-2.5 sm:px-5">
                                            Method
                                        </th>
                                        <th className="px-4 py-2.5">Path</th>
                                        <th className="hidden px-4 py-2.5 md:table-cell">
                                            Description
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ENDPOINTS.map((endpoint) => (
                                        <tr key={endpoint.path}>
                                            <td className="px-4 py-2.5 sm:px-5">
                                                <Badge tone="info">
                                                    {endpoint.method}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <code className="text-xs text-slate-800">
                                                    {endpoint.path}
                                                </code>
                                            </td>
                                            <td className="hidden px-4 py-2.5 text-sm text-slate-600 md:table-cell">
                                                {endpoint.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Panel>
                            <PanelHeader
                                title="Request examples"
                                description="Point the base URL at the API service."
                            />
                            <div className="p-4">
                                <CodeBlock
                                    code={CURL_EXAMPLE}
                                    caption="curl"
                                />
                            </div>
                        </Panel>
                        <Panel>
                            <PanelHeader
                                title="Response envelope"
                                description="Lists include pagination metadata; single records return data only."
                            />
                            <div className="p-4">
                                <CodeBlock
                                    code={RESPONSE_EXAMPLE}
                                    caption="JSON"
                                />
                            </div>
                        </Panel>
                    </div>

                    <Panel>
                        <PanelHeader title="Operational endpoints" />
                        <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
                            <EndpointTile
                                path="/health"
                                description="Liveness probe"
                            />
                            <EndpointTile
                                path="/ready"
                                description="Snapshot readiness"
                            />
                            <EndpointTile
                                path="/metrics"
                                description="Prometheus metrics"
                            />
                        </div>
                    </Panel>
                </>
            )}
        </div>
    );
}

function MetaRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5 sm:px-5">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-right text-sm break-words text-slate-900">
                {children}
            </span>
        </div>
    );
}

function EndpointTile({
    path,
    description,
}: {
    path: string;
    description: string;
}) {
    return (
        <a
            href={path}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
            <code className="text-xs font-medium text-slate-800">{path}</code>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </a>
    );
}
