"use client";

import { useEffect, useRef, useState } from "react";
import {
    describeError,
    isAbortError,
    listResource,
    searchEntities,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { getResourceConfig } from "@/lib/resources";
import { CHECKBOX_CLASS } from "@/lib/styles";
import type {
    GeoEntity,
    PaginationMeta,
    Resource,
} from "@/lib/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Panel, PanelHeader } from "@/components/panel";
import { SearchInput } from "@/components/search-input";
import { EntityTable } from "@/components/entity-table";
import { EntityDrawer } from "@/components/entity-drawer";
import { Button } from "@/components/button";
import { RefreshIcon } from "@/components/icons";

export type InitialResourcePage = {
    items: GeoEntity[];
    meta: PaginationMeta | null;
};

type ExplorerState = {
    key: string;
    items: GeoEntity[];
    meta: PaginationMeta | null;
    searchTotal: number | null;
    page: number;
    error: string | null;
};

export function ResourceExplorer({
    resource,
    title,
    initialPage = null,
}: {
    resource: Resource;
    title: string;
    initialPage?: InitialResourcePage | null;
}) {
    const config = getResourceConfig(resource);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, 300);
    const activeQuery = debouncedQuery.trim();
    const searchActive = activeQuery.length > 0;

    const [includeDeprecated, setIncludeDeprecated] = useState(false);
    const [state, setState] = useState<ExplorerState | null>(() =>
        initialPage
            ? {
                  key: `${resource}||false|0`,
                  items: initialPage.items,
                  meta: initialPage.meta,
                  searchTotal: null,
                  page: 1,
                  error: null,
              }
            : null
    );
    const hasInitialPage = useRef(initialPage !== null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);

    const requestKey = `${resource}|${activeQuery}|${includeDeprecated}|${refreshToken}`;

    useEffect(() => {
        if (hasInitialPage.current) {
            hasInitialPage.current = false;
            return;
        }

        const controller = new AbortController();
        const key = `${resource}|${activeQuery}|${includeDeprecated}|${refreshToken}`;

        const request = searchActive
            ? searchEntities({
                  q: activeQuery,
                  type: config.type,
                  page: 1,
                  limit: 50,
                  includeDeprecated,
                  signal: controller.signal,
              }).then((result) => ({
                  items: result.items,
                  meta: {
                      limit: result.limit,
                      hasMore: result.page < result.totalPages,
                      nextCursor: null,
                  } satisfies PaginationMeta,
                  searchTotal: result.total,
                  page: 1,
                  error: null,
              }))
            : listResource(resource, {
                  limit: 50,
                  includeDeprecated,
                  signal: controller.signal,
              }).then((result) => ({
                  items: result.items,
                  meta: result.meta,
                  searchTotal: null,
                  page: 1,
                  error: null,
              }));

        request
            .then((part) => {
                setState({ key, ...part });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        key,
                        items: [],
                        meta: null,
                        searchTotal: null,
                        page: 1,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [
        resource,
        activeQuery,
        searchActive,
        includeDeprecated,
        refreshToken,
        config.type,
    ]);

    const active = state?.key === requestKey ? state : null;
    const loading = state === null || state.key !== requestKey;
    const items = active?.items ?? [];
    const meta = active?.meta ?? null;
    const searchTotal = active?.searchTotal ?? null;
    const page = active?.page ?? 1;
    const error = active?.error ?? null;

    function reload() {
        setRefreshToken((token) => token + 1);
    }

    function closeDrawer() {
        setSelected(null);
    }

    async function loadMore() {
        if (loadingMore) {
            return;
        }

        setLoadingMore(true);
        const key = requestKey;

        try {
            if (searchActive) {
                const nextPage = page + 1;
                const result = await searchEntities({
                    q: activeQuery,
                    type: config.type,
                    page: nextPage,
                    limit: 50,
                    includeDeprecated,
                });
                setState((current) => {
                    if (!current || current.key !== key) {
                        return current;
                    }
                    return {
                        ...current,
                        items: [...current.items, ...result.items],
                        page: nextPage,
                        searchTotal: result.total,
                        meta: {
                            limit: result.limit,
                            hasMore: nextPage < result.totalPages,
                            nextCursor: null,
                        },
                        error: null,
                    };
                });
            } else if (meta?.nextCursor) {
                const result = await listResource(resource, {
                    limit: 50,
                    cursor: meta.nextCursor,
                    includeDeprecated,
                });
                setState((current) => {
                    if (!current || current.key !== key) {
                        return current;
                    }
                    return {
                        ...current,
                        items: [...current.items, ...result.items],
                        meta: result.meta,
                        error: null,
                    };
                });
            }
        } catch (caught) {
            setState((current) =>
                current && current.key === key
                    ? { ...current, error: describeError(caught) }
                    : current
            );
        } finally {
            setLoadingMore(false);
        }
    }

    return (
        <>
            <Panel>
                <PanelHeader
                    title={searchActive ? `Results in ${title}` : `All ${title}`}
                    description={
                        searchActive && searchTotal !== null
                            ? `${formatNumber(searchTotal)} matching records`
                            : "Sorted by name. Pages load 50 records at a time."
                    }
                    action={
                        <Button size="sm" onClick={reload} disabled={loading}>
                            <RefreshIcon
                                className={`h-3.5 w-3.5 ${
                                    loading ? "animate-spin" : ""
                                }`}
                            />
                            Refresh
                        </Button>
                    }
                />

                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="w-full sm:max-w-sm">
                        <SearchInput
                            id="explore-search"
                            value={query}
                            onChange={setQuery}
                            label={`Search ${title.toLowerCase()}`}
                            placeholder={`Search ${title.toLowerCase()} by name`}
                        />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
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

                <EntityTable
                    resource={resource}
                    items={items}
                    loading={loading}
                    loadingMore={loadingMore}
                    error={error}
                    hasMore={Boolean(meta?.hasMore)}
                    includeDeprecated={includeDeprecated}
                    onRetry={reload}
                    onLoadMore={loadMore}
                    onSelect={setSelected}
                />
            </Panel>

            <EntityDrawer
                open={selected !== null}
                resource={resource}
                code={selected}
                onClose={closeDrawer}
                onChanged={reload}
            />
        </>
    );
}
