"use client";

import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import {
    adminImport,
    describeError,
} from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { RESOURCES } from "@/lib/resources";
import { FIELD_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "@/lib/styles";
import type {
    ImportPayload,
    ImportSummary,
} from "@/lib/types";
import { useAdminKey } from "@/components/admin-key-provider";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/button";
import { Panel, PanelHeader } from "@/components/panel";
import { UploadIcon } from "@/components/icons";

const MAX_BYTES = 5 * 1024 * 1024;

const TEMPLATE = `{
  "datasetVersion": "2026-01-01-local",
  "note": "Manual correction batch",
  "divisions": [],
  "districts": [],
  "upazilas": [],
  "unions": [],
  "postOffices": []
}`;

const COLLECTION_KEYS = [
    "divisions",
    "districts",
    "upazilas",
    "unions",
    "postOffices",
] as const;

export function AdminImportPanel({
    onImported,
}: {
    onImported: () => void;
}) {
    const { apiKey, hasKey } = useAdminKey();
    const { pushToast } = useToast();

    const [raw, setRaw] = useState("");
    const [version, setVersion] = useState("");
    const [note, setNote] = useState("");
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        if (file.size > MAX_BYTES) {
            setFormError("The file is larger than the 5 MB import limit.");
            return;
        }

        try {
            const text = await file.text();
            setRaw(text);
            setFormError(null);
        } catch {
            setFormError("Could not read that file.");
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        setSummary(null);

        let parsed: unknown;

        try {
            parsed = JSON.parse(raw);
        } catch {
            setFormError("The payload is not valid JSON.");
            return;
        }

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            setFormError("Dataset JSON must be an object.");
            return;
        }

        const payload = parsed as ImportPayload & Record<string, unknown>;
        const present = COLLECTION_KEYS.filter((key) =>
            Array.isArray(payload[key]),
        );

        if (present.length === 0) {
            setFormError(
                "Include at least one collection: divisions, districts, upazilas, unions or postOffices.",
            );
            return;
        }

        const recordCount = present.reduce(
            (sum, key) => sum + (payload[key] as unknown[]).length,
            0,
        );

        if (recordCount === 0) {
            setFormError("The payload does not contain any records.");
            return;
        }

        if (version.trim()) {
            payload.datasetVersion = version.trim();
        }

        if (note.trim()) {
            payload.note = note.trim();
        }

        setPending(true);

        try {
            const result = await adminImport(payload, apiKey);
            setSummary(result);
            setRaw("");
            setVersion("");
            setNote("");
            pushToast(
                `Imported ${formatNumber(
                    Object.values(result.counts).reduce(
                        (sum, value) => sum + value,
                        0,
                    ),
                )} records.`,
                "success",
            );
            onImported();
        } catch (caught) {
            setFormError(describeError(caught));
        } finally {
            setPending(false);
        }
    }

    return (
        <Panel>
            <PanelHeader
                title={
                    <span className="flex items-center gap-2">
                        <UploadIcon className="h-4 w-4 text-slate-400" />
                        Import dataset
                    </span>
                }
                description="Bulk upsert by stable code. Imports are idempotent and invalidate the snapshot."
                action={
                    <Button
                        size="sm"
                        onClick={() => {
                            setRaw(TEMPLATE);
                            setFormError(null);
                        }}
                        disabled={pending}
                    >
                        Load template
                    </Button>
                }
            />

            <form onSubmit={submit} className="space-y-3 px-4 py-4 sm:px-5">
                {!hasKey ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                        Add an admin key above to enable imports.
                    </p>
                ) : null}

                <div>
                    <label htmlFor="import-payload" className={LABEL_CLASS}>
                        Dataset JSON
                    </label>
                    <textarea
                        id="import-payload"
                        value={raw}
                        onChange={(event) => setRaw(event.target.value)}
                        rows={12}
                        spellCheck={false}
                        placeholder={TEMPLATE}
                        className={`${TEXTAREA_CLASS} font-mono text-xs leading-5`}
                    />
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                            Up to 5 MB. Include stable codes for every record.
                        </span>
                        <span>{formatNumber(raw.length)} characters</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        <UploadIcon className="h-3.5 w-3.5" />
                        Load JSON file
                        <input
                            type="file"
                            accept="application/json,.json"
                            onChange={onFile}
                            className="sr-only"
                        />
                    </label>
                    {version ? (
                        <span className="text-xs text-slate-500">
                            Override version: {version}
                        </span>
                    ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label htmlFor="import-version" className={LABEL_CLASS}>
                            Dataset version (optional)
                        </label>
                        <input
                            id="import-version"
                            value={version}
                            onChange={(event) => setVersion(event.target.value)}
                            placeholder="2026-01-01-local"
                            className={FIELD_CLASS}
                        />
                    </div>
                    <div>
                        <label htmlFor="import-note" className={LABEL_CLASS}>
                            Import note (optional)
                        </label>
                        <input
                            id="import-note"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Corrected union spellings"
                            className={FIELD_CLASS}
                        />
                    </div>
                </div>

                {formError ? (
                    <p
                        role="alert"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"
                    >
                        {formError}
                    </p>
                ) : null}

                {summary ? (
                    <div
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-emerald-900">
                                Import committed
                            </p>
                            <span className="text-xs text-emerald-800">
                                {formatDateTime(summary.importedAt)}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-emerald-800">
                            Version <code>{summary.datasetVersion}</code>
                        </p>
                        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {RESOURCES.map((resource) => (
                                <div key={resource.value}>
                                    <dt className="text-[11px] text-emerald-800/80">
                                        {resource.label}
                                    </dt>
                                    <dd className="text-sm font-semibold text-emerald-950">
                                        {formatNumber(
                                            summary.counts[resource.countKey],
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={pending || !hasKey || !raw.trim()}
                    >
                        {pending ? "Importing..." : "Import dataset"}
                    </Button>
                    <Button
                        onClick={() => {
                            setRaw("");
                            setVersion("");
                            setNote("");
                            setFormError(null);
                            setSummary(null);
                        }}
                        disabled={pending}
                    >
                        Reset
                    </Button>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                    Parent references must exist in the same snapshot. Duplicate
                    names are allowed; codes define identity.
                </p>
            </form>
        </Panel>
    );
}
