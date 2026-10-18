"use client";

import Link from "next/link";
import { useDatasetMeta } from "@/hooks/use-dataset";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { AdminKeyPanel } from "@/components/admin/admin-key-panel";
import { AdminImportPanel } from "@/components/admin/admin-import-panel";
import { AdminRecordPanel } from "@/components/admin/admin-record-panel";
import { AlertIcon } from "@/components/icons";

export function AdminView() {
    const { data, reload } = useDatasetMeta();

    function handleChanged() {
        reload();
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Write operations"
                title="Administration"
                description="Import, correct and deprecate records. Every write requires an admin key and refreshes the in-memory snapshot."
                actions={
                    <Link
                        href="/dataset"
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                        Dataset details
                    </Link>
                }
            />

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
                Active snapshot{" "}
                <code className="text-slate-800">
                    {data?.datasetVersion ?? "unknown"}
                </code>
                {data?.importedAt
                    ? ` · imported ${formatDateTime(data.importedAt)}`
                    : null}
            </div>

            <AdminKeyPanel />

            <div className="grid items-start gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3">
                    <AdminImportPanel onImported={handleChanged} />
                </div>
                <div className="xl:col-span-2">
                    <AdminRecordPanel onChanged={handleChanged} />
                </div>
            </div>

            <Panel>
                <div className="flex items-start gap-2.5 px-4 py-3 sm:px-5">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-xs leading-5 text-slate-600">
                        <p className="font-medium text-slate-800">
                            Writes are immediate and idempotent.
                        </p>
                        <p className="mt-0.5">
                            Imports bulk upsert by code and require parent
                            references to exist in the same payload or snapshot.
                            Deletes are intentionally unsupported; deprecate a
                            record to hide it from default listings while keeping
                            it resolvable.
                        </p>
                    </div>
                </div>
            </Panel>
        </div>
    );
}
