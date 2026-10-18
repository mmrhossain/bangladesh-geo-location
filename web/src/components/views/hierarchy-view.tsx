"use client";

import { useState, useTransition } from "react";
import { formatNumber } from "@/lib/format";
import { CHECKBOX_CLASS } from "@/lib/styles";
import type {
    HierarchyNode,
    HierarchyResult,
    Resource,
} from "@/lib/types";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { EntityDrawer } from "@/components/entity-drawer";
import { ErrorBlock, LoadingBlock } from "@/components/states";
import {
    ChevronRightIcon,
    RefreshIcon,
} from "@/components/icons";

const DEPTH_OPTIONS = [
    { value: "2", label: "Divisions + districts" },
    { value: "3", label: "… + upazilas" },
    { value: "4", label: "… + unions" },
];

const LEVEL_RESOURCE: Record<number, Resource> = {
    1: "divisions",
    2: "districts",
    3: "upazilas",
    4: "unions",
};

export function HierarchyView({
    initialHierarchy = null,
}: {
    initialHierarchy?: HierarchyResult | null;
}) {
    const [depth, setDepth] = useState(2);
    const [includeDeprecated, setIncludeDeprecated] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState<{
        resource: Resource;
        code: string;
    } | null>(null);

    const { data, loading, error, reload } = useHierarchy(
        depth,
        includeDeprecated,
        initialHierarchy,
    );

    const totals = (() => {
        const divisions = data?.divisions ?? [];
        let districts = 0;
        let upazilas = 0;
        let unions = 0;

        for (const division of divisions) {
            districts += division.districts?.length ?? 0;
            if (depth >= 3) {
                for (const district of division.districts ?? []) {
                    upazilas += district.upazilas?.length ?? 0;
                }
            }
            if (depth >= 4) {
                for (const district of division.districts ?? []) {
                    for (const upazila of district.upazilas ?? []) {
                        unions += upazila.unions?.length ?? 0;
                    }
                }
            }
        }

        return { divisions: divisions.length, districts, upazilas, unions };
    })();

    function closeDrawer() {
        setSelected(null);
    }

    function onSelect(resource: Resource, code: string) {
        setSelected({ resource, code });
    }

    const changeDepth = (next: string) => {
        const parsed = Number(next);
        if (parsed === depth) {
            return;
        }
        startTransition(() => {
            setDepth(parsed);
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Structure"
                title="Administrative hierarchy"
                description="Walk from divisions down to unions. Expand a node to reveal the next level; select a name to inspect the record."
                actions={
                    <Button onClick={reload} disabled={loading}>
                        <RefreshIcon
                            className={`h-4 w-4 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                    </Button>
                }
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                    ariaLabel="Hierarchy depth"
                    options={DEPTH_OPTIONS}
                    value={String(depth)}
                    onChange={changeDepth}
                />
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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <SummaryTile label="Divisions" value={totals.divisions} />
                <SummaryTile label="Districts" value={totals.districts} />
                <SummaryTile
                    label="Upazilas"
                    value={depth >= 3 ? totals.upazilas : null}
                />
                <SummaryTile
                    label="Unions"
                    value={depth >= 4 ? totals.unions : null}
                />
            </div>

            <div
                className={`transition-opacity ${
                    isPending ? "opacity-60" : "opacity-100"
                }`}
            >
                {loading && !data ? (
                    <Panel>
                        <LoadingBlock label="Loading hierarchy" />
                    </Panel>
                ) : error && !data ? (
                    <Panel>
                        <ErrorBlock message={error} onRetry={reload} />
                    </Panel>
                ) : data && data.divisions.length > 0 ? (
                    <div className="space-y-4">
                        {data.divisions.map((division) => (
                            <DivisionCard
                                key={division.code}
                                division={division}
                                depth={depth}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                ) : (
                    <Panel>
                        <p className="px-5 py-10 text-center text-sm text-slate-500">
                            No hierarchy data is available in this snapshot.
                        </p>
                    </Panel>
                )}
            </div>

            <EntityDrawer
                open={selected !== null}
                resource={selected?.resource ?? "divisions"}
                code={selected?.code ?? null}
                onClose={closeDrawer}
                onChanged={reload}
            />
        </div>
    );
}

function SummaryTile({
    label,
    value,
}: {
    label: string;
    value: number | null;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {value === null ? "—" : formatNumber(value)}
            </p>
        </div>
    );
}

function DivisionCard({
    division,
    depth,
    onSelect,
}: {
    division: HierarchyNode;
    depth: number;
    onSelect: (resource: Resource, code: string) => void;
}) {
    const districts = division.districts ?? [];

    return (
        <Panel>
            <PanelHeader
                title={
                    <span className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onSelect("divisions", division.code)}
                            className="text-left transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                            {division.name}
                        </button>
                        <span className="text-xs font-normal text-slate-500">
                            {division.bn_name}
                        </span>
                        {division.deprecated_at ? (
                            <Badge tone="warning">Deprecated</Badge>
                        ) : null}
                    </span>
                }
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <code>{division.code}</code>
                        {division.iso_code ? (
                            <span>ISO {division.iso_code}</span>
                        ) : null}
                        <span>
                            {formatNumber(districts.length)}{" "}
                            {districts.length === 1 ? "district" : "districts"}
                        </span>
                    </span>
                }
            />
            <ul className="p-2">
                {districts.map((district) => (
                    <TreeNode
                        key={district.code}
                        node={district}
                        level={2}
                        maxDepth={depth}
                        onSelect={onSelect}
                    />
                ))}
            </ul>
        </Panel>
    );
}

function TreeNode({
    node,
    level,
    maxDepth,
    onSelect,
}: {
    node: HierarchyNode;
    level: number;
    maxDepth: number;
    onSelect: (resource: Resource, code: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const childKey =
        level === 1
            ? "districts"
            : level === 2
              ? "upazilas"
              : level === 3
                ? "unions"
                : null;
    const children = childKey ? (node[childKey] ?? []) : [];
    const canExpand = level < maxDepth && children.length > 0;
    const resource = LEVEL_RESOURCE[level] ?? "districts";

    return (
        <li>
            <div
                className="flex items-center gap-1.5 rounded-lg pr-2 transition hover:bg-slate-50"
                style={{ paddingLeft: `${(level - 2) * 14}px` }}
            >
                {canExpand ? (
                    <button
                        type="button"
                        onClick={() => setExpanded((current) => !current)}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${
                            node.name
                        }`}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        <ChevronRightIcon
                            className={`h-3.5 w-3.5 transition-transform ${
                                expanded ? "rotate-90" : ""
                            }`}
                        />
                    </button>
                ) : (
                    <span className="w-[22px]" aria-hidden="true" />
                )}

                <button
                    type="button"
                    onClick={() => onSelect(resource, node.code)}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    <span className="truncate text-sm text-slate-800">
                        {node.name}
                    </span>
                    <span className="hidden truncate text-xs text-slate-500 sm:inline">
                        {node.bn_name}
                    </span>
                    {node.deprecated_at ? (
                        <Badge tone="warning">Deprecated</Badge>
                    ) : null}
                </button>

                <code className="hidden shrink-0 text-[11px] text-slate-400 sm:block">
                    {node.code}
                </code>
                {children.length > 0 ? (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {formatNumber(children.length)}
                    </span>
                ) : null}
            </div>

            {expanded && canExpand ? (
                <ul>
                    {children.map((child) => (
                        <TreeNode
                            key={child.code}
                            node={child}
                            level={level + 1}
                            maxDepth={maxDepth}
                            onSelect={onSelect}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}
