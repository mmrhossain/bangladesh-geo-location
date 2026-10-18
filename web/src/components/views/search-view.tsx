"use client";

import { useEffect, useState, useTransition } from "react";
import {
    describeError,
    isAbortError,
    searchEntities,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
    ENTITY_TYPES,
    getEntityTypeLabel,
    getResourceForType,
} from "@/lib/resources";
import { CHECKBOX_CLASS } from "@/lib/styles";
import type { EntityType, SearchResult } from "@/lib/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/states";
import { EntityDrawer } from "@/components/entity-drawer";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";

const PAGE_SIZE = 30;

const SUGGESTIONS = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"];

type SearchState = {
    key: string;
    results: SearchResult[];
    page: number;
    total: number;
    totalPages: number;
    error: string | null;
};

export function SearchView() {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, 300);
    const activeQuery = debouncedQuery.trim();
    const [type, setType] = useState<EntityType | "">("");
    const [includeDeprecated, setIncludeDeprecated] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [state, setState] = useState<SearchState | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    const [selected, setSelected] = useState<SearchResult | null>(null);

    const requestKey = `${activeQuery}|${type}|${includeDeprecated}|${refreshToken}`;

    useEffect(() => {
        if (!activeQuery) {
            return;
        }

        const controller = new AbortController();
        const key = `${activeQuery}|${type}|${includeDeprecated}|${refreshToken}`;

        searchEntities({
            q: activeQuery,
            type,
            page: 1,
            limit: PAGE_SIZE,
            includeDeprecated,
            signal: controller.signal,
        })
            .then((result) => {
                setState({
                    key,
                    results: result.items,
                    page: result.page,
                    total: result.total,
                    totalPages: result.totalPages,
                    error: null,
                });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        key,
                        results: [],
                        page: 1,
                        total: 0,
                        totalPages: 0,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [activeQuery, type, includeDeprecated, refreshToken]);

    const active = state?.key === requestKey ? state : null;
    const loading = Boolean(activeQuery) && state?.key !== requestKey;
    const results = activeQuery ? (active?.results ?? []) : [];
    const page = active?.page ?? 1;
    const total = active?.total ?? 0;
    const totalPages = active?.totalPages ?? 0;
    const error = active?.error ?? null;

    function closeDrawer() {
        setSelected(null);
    }

    function reload() {
        setRefreshToken((token) => token + 1);
    }

    async function loadMore() {
        if (loadingMore) {
            return;
        }

        setLoadingMore(true);
        const key = requestKey;

        try {
            const nextPage = page + 1;
            const result = await searchEntities({
                q: activeQuery,
                type,
                page: nextPage,
                limit: PAGE_SIZE,
                includeDeprecated,
            });
            setState((current) => {
                if (!current || current.key !== key) {
                    return current;
                }
                return {
                    ...current,
                    results: [...current.results, ...result.items],
                    page: result.page,
                    total: result.total,
                    totalPages: result.totalPages,
                    error: null,
                };
            });
        } catch (caught) {
            setState((current) =>
                current && current.key === key
                    ? { ...current, error: describeError(caught) }
                    : current,
            );
        } finally {
            setLoadingMore(false);
        }
    }

    const typeOptions: { value: EntityType | ""; label: string }[] = [
        { value: "", label: "All types" },
        ...ENTITY_TYPES,
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Discovery"
                title="Search"
                description="Search across every administrative level. Matching covers English and Bangla names, aliases and codes."
            />

            <Panel>
                <div className="space-y-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                    <SearchInput
                        id="site-search"
                        value={query}
                        onChange={setQuery}
                        label="Search all records"
                        placeholder="Try Dhaka, Chattogram or a union code"
                    />
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <Tabs
                            ariaLabel="Entity type"
                            options={typeOptions}
                            value={type}
                            onChange={(next) => {
                                startTransition(() => {
                                    setType(next);
                                    setSelected(null);
                                });
                            }}
                        />
                        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                className={CHECKBOX_CLASS}
                                checked={includeDeprecated}
                                onChange={(event) =>
                                    setIncludeDeprecated(event.target.checked)
                                }
                            />
                            Include deprecated
                        </label>
                    </div>
                </div>

                <PanelHeader
                    title={
                        activeQuery
                            ? `Results for “${activeQuery}”`
                            : "Start typing to search"
                    }
                    description={
                        activeQuery
                            ? `${formatNumber(total)} records across all levels`
                            : "Results update as you type. Search accepts English and Bangla script."
                    }
                    action={
                        activeQuery && results.length > 0 ? (
                            <Button size="sm" onClick={reload} disabled={loading}>
                                Refresh
                            </Button>
                        ) : undefined
                    }
                />

                <div
                    className={`transition-opacity ${
                        isPending ? "opacity-60" : "opacity-100"
                    }`}
                >
                    {!activeQuery ? (
                        <div className="px-4 py-8 sm:px-5">
                            <div className="mx-auto max-w-md text-center">
                                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                    <SearchIcon className="h-5 w-5" />
                                </span>
                                <p className="mt-3 text-sm font-semibold text-slate-900">
                                    Find divisions, districts, upazilas and unions
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Search by name, alias or administrative code.
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {SUGGESTIONS.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => setQuery(suggestion)}
                                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : loading && results.length === 0 ? (
                        <LoadingBlock label="Searching records" />
                    ) : error && results.length === 0 ? (
                        <ErrorBlock message={error} onRetry={reload} />
                    ) : results.length === 0 ? (
                        <EmptyState
                            title="No matches"
                            description={`Nothing matched “${activeQuery}”. Check the spelling or include deprecated records.`}
                        />
                    ) : (
                        <div>
                            <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                                {results.map((result) => (
                                    <li key={`${result.type}:${result.code}`}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(result)}
                                            className="group flex h-full w-full flex-col rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {result.name}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {result.bn_name || "—"}
                                                    </p>
                                                </div>
                                                <Badge tone="info">
                                                    {getEntityTypeLabel(result.type)}
                                                </Badge>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-slate-500">
                                                <code>{result.code}</code>
                                                <span className="inline-flex items-center gap-1 text-emerald-700 opacity-0 transition group-hover:opacity-100">
                                                    View
                                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                                </span>
                                            </div>
                                            {result.deprecated_at ? (
                                                <Badge
                                                    tone="warning"
                                                    className="mt-2 self-start"
                                                >
                                                    Deprecated
                                                </Badge>
                                            ) : null}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <p className="text-xs text-slate-500">
                                    Showing {formatNumber(results.length)} of{" "}
                                    {formatNumber(total)} matches
                                </p>
                                {page < totalPages ? (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? "Loading..." : "Load more"}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </Panel>

            <EntityDrawer
                open={selected !== null}
                resource={
                    selected ? getResourceForType(selected.type) : "divisions"
                }
                code={selected?.code ?? null}
                onClose={closeDrawer}
                onChanged={reload}
            />
        </div>
    );
}
