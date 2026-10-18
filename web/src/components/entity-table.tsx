"use client";

import type { GeoEntity, Resource } from "@/lib/types";
import { getResourceConfig } from "@/lib/resources";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/states";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { ChevronRightIcon, RefreshIcon } from "@/components/icons";

export function EntityTable({
    resource,
    items,
    loading,
    error,
    hasMore,
    onRetry,
    onLoadMore,
    onSelect,
    loadingMore = false,
    includeDeprecated = false,
}: {
    resource: Resource;
    items: GeoEntity[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    onRetry: () => void;
    onLoadMore: () => void;
    onSelect: (code: string) => void;
    loadingMore?: boolean;
    includeDeprecated?: boolean;
}) {
    const config = getResourceConfig(resource);
    const showsParent = config.parentKey !== null;
    const showsIso = config.value === "divisions";

    if (loading && items.length === 0) {
        return <LoadingBlock label={`Loading ${config.label.toLowerCase()}`} />;
    }

    if (error && items.length === 0) {
        return <ErrorBlock message={error} onRetry={onRetry} />;
    }

    if (items.length === 0) {
        return (
            <EmptyState
                title={`No ${config.label.toLowerCase()} found`}
                description="Try a different search term or include deprecated records."
            />
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <caption className="sr-only">
                        {config.label} records
                    </caption>
                    <thead className="bg-slate-50">
                        <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                            <th scope="col" className="px-4 py-2.5 sm:px-5">
                                Name
                            </th>
                            <th
                                scope="col"
                                className="hidden px-4 py-2.5 sm:table-cell"
                            >
                                Code
                            </th>
                            {showsParent ? (
                                <th
                                    scope="col"
                                    className="hidden px-4 py-2.5 md:table-cell"
                                >
                                    {config.parentLabel}
                                </th>
                            ) : null}
                            {showsIso ? (
                                <th
                                    scope="col"
                                    className="hidden px-4 py-2.5 lg:table-cell"
                                >
                                    ISO
                                </th>
                            ) : null}
                            {includeDeprecated ? (
                                <th
                                    scope="col"
                                    className="hidden px-4 py-2.5 lg:table-cell"
                                >
                                    Status
                                </th>
                            ) : null}
                            <th scope="col" className="px-4 py-2.5">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                            const deprecated = Boolean(item.deprecated_at);
                            const parentCode = config.parentKey
                                ? item[config.parentKey]
                                : null;

                            return (
                                <tr
                                    key={item.code}
                                    className={
                                        deprecated ? "bg-amber-50/50" : undefined
                                    }
                                >
                                    <td className="px-4 py-3 sm:px-5">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(item.code)}
                                            className="block max-w-64 truncate text-left text-sm font-medium text-slate-900 transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                        >
                                            {item.name}
                                        </button>
                                        <p className="mt-0.5 max-w-64 truncate text-xs text-slate-500">
                                            {item.bn_name || "—"}
                                            <span className="sm:hidden">
                                                {" · "}
                                                {item.code}
                                            </span>
                                        </p>
                                    </td>
                                    <td className="hidden px-4 py-3 text-xs text-slate-600 sm:table-cell">
                                        <code>{item.code}</code>
                                    </td>
                                    {showsParent ? (
                                        <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell">
                                            {parentCode ? (
                                                <code>{parentCode}</code>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    ) : null}
                                    {showsIso ? (
                                        <td className="hidden px-4 py-3 text-xs text-slate-600 lg:table-cell">
                                            {item.iso_code || "—"}
                                        </td>
                                    ) : null}
                                    {includeDeprecated ? (
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            {deprecated ? (
                                                <Badge tone="warning">Deprecated</Badge>
                                            ) : (
                                                <Badge tone="success">Active</Badge>
                                            )}
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(item.code)}
                                            aria-label={`View ${item.name}`}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                        >
                                            View
                                            <ChevronRightIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-500">
                    Showing {items.length} {config.label.toLowerCase()}
                    {deprecatedCountSuffix(items)}
                </p>
                <div className="flex items-center gap-2">
                    {error ? (
                        <Button size="sm" onClick={onRetry}>
                            <RefreshIcon className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    ) : null}
                    {hasMore ? (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={onLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? "Loading..." : "Load more"}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function deprecatedCountSuffix(items: GeoEntity[]): string {
    const deprecated = items.filter((item) => item.deprecated_at).length;
    if (deprecated === 0) {
        return "";
    }
    return ` (${deprecated} deprecated)`;
}
