"use client";

import {
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import {
    adminDeprecate,
    adminUpdate,
    describeError,
    getEntity,
} from "@/lib/api";
import { formatDateTime, splitAliases } from "@/lib/format";
import { getResourceConfig, RESOURCES } from "@/lib/resources";
import { FIELD_CLASS, LABEL_CLASS } from "@/lib/styles";
import type {
    AdminUpdatePayload,
    GeoEntity,
    Resource,
} from "@/lib/types";
import { useAdminKey } from "@/components/admin-key-provider";
import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Panel, PanelHeader } from "@/components/panel";
import {
    AlertIcon,
    EditIcon,
    EyeIcon,
    EyeOffIcon,
    SearchIcon,
} from "@/components/icons";

export function AdminRecordPanel({
    onChanged,
}: {
    onChanged: () => void;
}) {
    const { apiKey, hasKey } = useAdminKey();
    const { pushToast } = useToast();

    const [resource, setResource] = useState<Resource>("districts");
    const [codeInput, setCodeInput] = useState("");
    const [entity, setEntity] = useState<GeoEntity | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deprecating, setDeprecating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [bnName, setBnName] = useState("");
    const [aliases, setAliases] = useState("");
    const [isoCode, setIsoCode] = useState("");

    const config = getResourceConfig(resource);

    function startEditing() {
        if (!entity) {
            return;
        }

        setName(entity.name ?? "");
        setBnName(entity.bn_name ?? "");
        setAliases((entity.aliases ?? []).join(", "));
        setIsoCode(entity.iso_code ?? "");
        setEditing(true);
    }

    async function load(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const code = codeInput.trim();

        if (!code) {
            setError("Enter a record code.");
            return;
        }

        setLoading(true);
        setError(null);
        setEntity(null);
        setEditing(false);

        try {
            const found = await getEntity(resource, code);
            setEntity(found);
        } catch (caught) {
            setError(describeError(caught));
        } finally {
            setLoading(false);
        }
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!entity) {
            return;
        }

        if (!name.trim()) {
            pushToast("A name is required.", "error");
            return;
        }

        const payload: AdminUpdatePayload = {
            name: name.trim(),
            aliases: splitAliases(aliases),
        };

        if (bnName.trim()) {
            payload.bn_name = bnName.trim();
        }

        if (resource === "divisions") {
            payload.iso_code = isoCode.trim() || null;
        }

        setSaving(true);

        try {
            const updated = await adminUpdate(
                resource,
                entity.code,
                payload,
                apiKey,
            );
            setEntity(updated);
            setEditing(false);
            pushToast(`${updated.name} updated.`, "success");
            onChanged();
        } catch (caught) {
            pushToast(describeError(caught), "error");
        } finally {
            setSaving(false);
        }
    }

    async function toggleDeprecated() {
        if (!entity) {
            return;
        }

        const next = !entity.deprecated_at;
        setDeprecating(true);

        try {
            const updated = await adminDeprecate(
                resource,
                entity.code,
                next,
                apiKey,
            );
            setEntity(updated);
            pushToast(
                next
                    ? `${updated.name} marked as deprecated.`
                    : `${updated.name} restored.`,
                "success",
            );
            onChanged();
        } catch (caught) {
            pushToast(describeError(caught), "error");
        } finally {
            setDeprecating(false);
        }
    }

    return (
        <Panel>
            <PanelHeader
                title={
                    <span className="flex items-center gap-2">
                        <EditIcon className="h-4 w-4 text-slate-400" />
                        Maintain a record
                    </span>
                }
                description="Resolve a record by code, then edit names, aliases or deprecate it."
            />

            <div className="space-y-4 px-4 py-4 sm:px-5">
                <form
                    onSubmit={load}
                    className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                >
                    <div>
                        <label htmlFor="record-resource" className={LABEL_CLASS}>
                            Level
                        </label>
                        <select
                            id="record-resource"
                            value={resource}
                            onChange={(event) => {
                                setResource(event.target.value as Resource);
                                setEntity(null);
                                setCodeInput("");
                                setError(null);
                                setEditing(false);
                            }}
                            className={FIELD_CLASS}
                        >
                            {RESOURCES.map((entry) => (
                                <option key={entry.value} value={entry.value}>
                                    {entry.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="record-code" className={LABEL_CLASS}>
                            Code
                        </label>
                        <input
                            id="record-code"
                            value={codeInput}
                            onChange={(event) => setCodeInput(event.target.value)}
                            placeholder={`e.g. ${exampleCode(resource)}`}
                            className={FIELD_CLASS}
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !codeInput.trim()}
                            className="w-full sm:w-auto"
                        >
                            <SearchIcon className="h-4 w-4" />
                            {loading ? "Loading..." : "Load"}
                        </Button>
                    </div>
                </form>

                {error ? (
                    <p
                        role="alert"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"
                    >
                        {error}
                    </p>
                ) : null}

                {!entity ? (
                    <p className="text-sm text-slate-500">
                        Load a record to see its current values and write actions.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {entity.name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {entity.bn_name} · {config.singular}{" "}
                                    <code>{entity.code}</code>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {entity.deprecated_at ? (
                                    <Badge tone="warning">Deprecated</Badge>
                                ) : (
                                    <Badge tone="success">Active</Badge>
                                )}
                                {hasKey && !editing ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={startEditing}
                                        >
                                            <EditIcon className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={
                                                entity.deprecated_at
                                                    ? "primary"
                                                    : "danger"
                                            }
                                            onClick={toggleDeprecated}
                                            disabled={deprecating}
                                        >
                                            {entity.deprecated_at ? (
                                                <>
                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                    Restore
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOffIcon className="h-3.5 w-3.5" />
                                                    Deprecate
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {entity.deprecated_at ? (
                            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Deprecated since{" "}
                                {formatDateTime(entity.deprecated_at)}. Hidden
                                from default listings but still resolvable by
                                code.
                            </p>
                        ) : null}

                        {!hasKey ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                                Add an admin key above to edit or deprecate this
                                record.
                            </p>
                        ) : editing ? (
                            <form onSubmit={save} className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="record-name"
                                            className={LABEL_CLASS}
                                        >
                                            English name
                                        </label>
                                        <input
                                            id="record-name"
                                            value={name}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                            className={FIELD_CLASS}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="record-bn"
                                            className={LABEL_CLASS}
                                        >
                                            Bangla name
                                        </label>
                                        <input
                                            id="record-bn"
                                            value={bnName}
                                            onChange={(event) =>
                                                setBnName(event.target.value)
                                            }
                                            className={FIELD_CLASS}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="record-aliases"
                                        className={LABEL_CLASS}
                                    >
                                        Aliases (comma separated)
                                    </label>
                                    <input
                                        id="record-aliases"
                                        value={aliases}
                                        onChange={(event) =>
                                            setAliases(event.target.value)
                                        }
                                        className={FIELD_CLASS}
                                    />
                                </div>
                                {resource === "divisions" ? (
                                    <div>
                                        <label
                                            htmlFor="record-iso"
                                            className={LABEL_CLASS}
                                        >
                                            ISO code
                                        </label>
                                        <input
                                            id="record-iso"
                                            value={isoCode}
                                            onChange={(event) =>
                                                setIsoCode(event.target.value)
                                            }
                                            placeholder="BD-10"
                                            className={FIELD_CLASS}
                                        />
                                    </div>
                                ) : null}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save changes"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setEditing(false)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                <Detail label="English name">
                                    {entity.name}
                                </Detail>
                                <Detail label="Bangla name">
                                    {entity.bn_name || "—"}
                                </Detail>
                                {config.parentKey ? (
                                    <Detail label={config.parentLabel}>
                                        {entity[config.parentKey] ?? "—"}
                                    </Detail>
                                ) : (
                                    <Detail label="ISO code">
                                        {entity.iso_code || "—"}
                                    </Detail>
                                )}
                                <Detail label="Dataset version">
                                    {entity.dataset_version || "—"}
                                </Detail>
                                <Detail label="Aliases">
                                    {entity.aliases && entity.aliases.length > 0
                                        ? entity.aliases.join(", ")
                                        : "—"}
                                </Detail>
                                <Detail label="Deprecated at">
                                    {formatDateTime(entity.deprecated_at)}
                                </Detail>
                            </dl>
                        )}
                    </div>
                )}
            </div>
        </Panel>
    );
}

function Detail({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-sm break-words text-slate-900">
                {children}
            </dd>
        </div>
    );
}

function exampleCode(resource: Resource): string {
    switch (resource) {
        case "divisions":
            return "BD-13";
        case "districts":
            return "D-13";
        case "upazilas":
            return "U-0001";
        case "unions":
            return "UN-0001";
        case "post-offices":
            return "PO-0001";
        default:
            return "D-13";
    }
}
