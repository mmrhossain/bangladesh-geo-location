"use client";

import {
    useEffect,
    useOptimistic,
    useState,
    useTransition,
    type FormEvent,
    type ReactNode,
} from "react";
import Link from "next/link";
import {
    adminDeprecate,
    adminUpdate,
    describeError,
} from "@/lib/api";
import { splitAliases } from "@/lib/format";
import { getResourceConfig } from "@/lib/resources";
import type { AdminUpdatePayload, GeoEntity, Resource } from "@/lib/types";
import { FIELD_CLASS, LABEL_CLASS } from "@/lib/styles";
import { useAdminKey } from "@/components/admin-key-provider";
import { useToast } from "@/components/toast-provider";
import { useEntity } from "@/hooks/use-entity";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import {
    AlertIcon,
    CloseIcon,
    EditIcon,
    EyeIcon,
    EyeOffIcon,
    KeyIcon,
} from "@/components/icons";
import { ErrorBlock, LoadingBlock } from "@/components/states";

export function EntityDrawer({
    open,
    resource,
    code,
    onClose,
    onChanged,
}: {
    open: boolean;
    resource: Resource;
    code: string | null;
    onClose: () => void;
    onChanged?: () => void;
}) {
    const config = getResourceConfig(resource);
    const { entity, loading, error, reload } = useEntity(
        resource,
        open ? code : null,
    );
    const { apiKey, hasKey } = useAdminKey();
    const { pushToast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [bnName, setBnName] = useState("");
    const [aliases, setAliases] = useState("");
    const [isoCode, setIsoCode] = useState("");

    const [optimisticEntity, applyOptimistic] = useOptimistic<
        GeoEntity | null,
        { deprecated: boolean }
    >(entity, (current, action) =>
        current
            ? {
                  ...current,
                  deprecated_at: action.deprecated
                      ? new Date().toISOString()
                      : null,
              }
            : current,
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const current = optimisticEntity;
    const deprecated = Boolean(current?.deprecated_at);

    function startEditing() {
        if (!current) {
            return;
        }

        setName(current.name ?? "");
        setBnName(current.bn_name ?? "");
        setAliases((current.aliases ?? []).join(", "));
        setIsoCode(current.iso_code ?? "");
        setEditing(true);
    }

    function toggleDeprecated() {
        if (!current || !hasKey) {
            return;
        }

        const next = !current.deprecated_at;

        startTransition(async () => {
            applyOptimistic({ deprecated: next });

            try {
                await adminDeprecate(
                    resource,
                    current.code,
                    next,
                    apiKey,
                );
                pushToast(
                    next
                        ? `${current.name} marked as deprecated.`
                        : `${current.name} restored.`,
                    "success",
                );
                reload();
                onChanged?.();
            } catch (caught) {
                pushToast(describeError(caught), "error");
            }
        });
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!current) {
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
                current.code,
                payload,
                apiKey,
            );
            pushToast(`${updated.name} updated.`, "success");
            setEditing(false);
            reload();
            onChanged?.();
        } catch (caught) {
            pushToast(describeError(caught), "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="entity-drawer-title"
            className="fixed inset-0 z-50 flex justify-end"
        >
            <button
                type="button"
                aria-label="Close details"
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            />

            <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="info">{config.singular}</Badge>
                            {current ? (
                                <span className="text-xs text-slate-500">
                                    <code>{current.code}</code>
                                </span>
                            ) : null}
                        </div>
                        <h2
                            id="entity-drawer-title"
                            className="mt-1.5 truncate text-lg font-semibold text-slate-900"
                        >
                            {current?.name ?? config.singular}
                        </h2>
                        {current?.bn_name ? (
                            <p className="truncate text-sm text-slate-600">
                                {current.bn_name}
                            </p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close details"
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                    {loading && !current ? (
                        <LoadingBlock label="Loading record" />
                    ) : error && !current ? (
                        <ErrorBlock message={error} onRetry={reload} />
                    ) : current ? (
                        <div className="space-y-5">
                            {deprecated ? (
                                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>
                                        This record is deprecated and hidden from
                                        default listings. It is still resolvable by
                                        code.
                                    </p>
                                </div>
                            ) : null}

                            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                <Detail label="English name">
                                    {current.name}
                                </Detail>
                                <Detail label="Bangla name">
                                    {current.bn_name || "—"}
                                </Detail>
                                <Detail label="Code">
                                    <span className="inline-flex items-center gap-1">
                                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                                            {current.code}
                                        </code>
                                        <CopyButton
                                            value={current.code}
                                            label="Copy"
                                        />
                                    </span>
                                </Detail>
                                {config.parentKey ? (
                                    <Detail label={config.parentLabel}>
                                        {current[config.parentKey] ? (
                                            <code className="text-xs">
                                                {current[config.parentKey]}
                                            </code>
                                        ) : (
                                            "—"
                                        )}
                                    </Detail>
                                ) : null}
                                {config.value === "divisions" ? (
                                    <Detail label="ISO code">
                                        {current.iso_code || "—"}
                                    </Detail>
                                ) : null}
                                <Detail label="Slug">
                                    {current.slug || "—"}
                                </Detail>
                                <Detail label="Dataset version">
                                    {current.dataset_version || "—"}
                                </Detail>
                                <Detail label="Status">
                                    {deprecated ? (
                                        <Badge tone="warning">Deprecated</Badge>
                                    ) : (
                                        <Badge tone="success">Active</Badge>
                                    )}
                                </Detail>
                            </dl>

                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Aliases
                                </p>
                                {current.aliases && current.aliases.length > 0 ? (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {current.aliases.map((alias, index) => (
                                            <Badge key={`${alias}-${index}`}>
                                                {alias}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-slate-600">
                                        No aliases recorded.
                                    </p>
                                )}
                            </div>

                            <section className="rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <KeyIcon className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Maintenance
                                        </h3>
                                    </div>
                                    {hasKey && !editing ? (
                                        <div className="flex gap-2">
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
                                                    deprecated
                                                        ? "primary"
                                                        : "danger"
                                                }
                                                onClick={toggleDeprecated}
                                                disabled={isPending}
                                            >
                                                {deprecated ? (
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
                                        </div>
                                    ) : null}
                                </div>

                                {!hasKey ? (
                                    <div className="px-3 py-3">
                                        <p className="text-sm leading-6 text-slate-600">
                                            Writes require an admin key.{" "}
                                            <Link
                                                href="/admin"
                                                className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
                                            >
                                                Unlock admin actions
                                            </Link>{" "}
                                            to edit or deprecate this record.
                                        </p>
                                    </div>
                                ) : editing ? (
                                    <form
                                        onSubmit={save}
                                        className="space-y-3 px-3 py-3"
                                    >
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="edit-name"
                                                    className={LABEL_CLASS}
                                                >
                                                    English name
                                                </label>
                                                <input
                                                    id="edit-name"
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
                                                    htmlFor="edit-bn"
                                                    className={LABEL_CLASS}
                                                >
                                                    Bangla name
                                                </label>
                                                <input
                                                    id="edit-bn"
                                                    value={bnName}
                                                    onChange={(event) =>
                                                        setBnName(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={FIELD_CLASS}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="edit-aliases"
                                                className={LABEL_CLASS}
                                            >
                                                Aliases (comma separated)
                                            </label>
                                            <input
                                                id="edit-aliases"
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
                                                    htmlFor="edit-iso"
                                                    className={LABEL_CLASS}
                                                >
                                                    ISO code
                                                </label>
                                                <input
                                                    id="edit-iso"
                                                    value={isoCode}
                                                    onChange={(event) =>
                                                        setIsoCode(
                                                            event.target.value,
                                                        )
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
                                    <p className="px-3 py-3 text-xs leading-5 text-slate-500">
                                        Admin key detected. Edit names or
                                        deprecate this record directly here.
                                    </p>
                                )}
                            </section>

                            <details className="rounded-xl border border-slate-200">
                                <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-slate-700">
                                    Raw record
                                </summary>
                                <div className="border-t border-slate-200 p-3">
                                    <CodeBlock
                                        code={JSON.stringify(current, null, 2)}
                                        caption={`${config.singular} JSON`}
                                    />
                                </div>
                            </details>
                        </div>
                    ) : null}
                </div>

                <footer className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
                    Dataset version{" "}
                    <code className="text-slate-700">
                        {current?.dataset_version ?? "—"}
                    </code>
                </footer>
            </div>
        </div>
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
