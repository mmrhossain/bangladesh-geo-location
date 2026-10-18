"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { getResourceConfig, RESOURCES } from "@/lib/resources";
import type { DatasetMeta, Resource } from "@/lib/types";
import { useDatasetMeta } from "@/hooks/use-dataset";
import { PageHeader } from "@/components/page-header";
import { Tabs } from "@/components/tabs";
import {
    ResourceExplorer,
    type InitialResourcePage,
} from "@/components/explore/resource-explorer";

export function ExploreView({
    initialMeta = null,
    initialDivisions = null,
}: {
    initialMeta?: DatasetMeta | null;
    initialDivisions?: InitialResourcePage | null;
}) {
    const [resource, setResource] = useState<Resource>("divisions");
    const [isPending, startTransition] = useTransition();
    const metaState = useDatasetMeta(initialMeta);

    const counts = metaState.data?.counts;
    const config = getResourceConfig(resource);

    const changeResource = (next: Resource) => {
        if (next === resource) {
            return;
        }

        startTransition(() => {
            setResource(next);
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Reference data"
                title="Explorer"
                description="Browse each administrative level with cursor pagination and deprecated-record visibility."
                actions={
                    <Link
                        href="/hierarchy"
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                        Prefer the tree view?
                    </Link>
                }
            />

            <Tabs
                ariaLabel="Administrative level"
                value={resource}
                onChange={changeResource}
                options={RESOURCES.map((entry) => ({
                    value: entry.value,
                    label: entry.label,
                    count: counts ? counts[entry.countKey] : undefined,
                }))}
            />

            <div
                className={`transition-opacity ${
                    isPending ? "opacity-60" : "opacity-100"
                }`}
            >
                <ResourceExplorer
                    key={resource}
                    resource={resource}
                    title={config.label}
                    initialPage={
                        resource === "divisions" ? initialDivisions : null
                    }
                />
            </div>
        </div>
    );
}
