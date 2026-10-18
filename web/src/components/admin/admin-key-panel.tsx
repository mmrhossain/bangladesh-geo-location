"use client";

import {
    useActionState,
} from "react";
import { useAdminKey } from "@/components/admin-key-provider";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { Panel, PanelHeader } from "@/components/panel";
import { FIELD_CLASS, LABEL_CLASS } from "@/lib/styles";
import { CheckIcon, KeyIcon } from "@/components/icons";

export function AdminKeyPanel() {
    const { apiKey, hasKey, setApiKey, clearApiKey } = useAdminKey();
    const { pushToast } = useToast();

    const [state, submit, pending] = useActionState(
        async (
            _previous: { error: string | null },
            formData: FormData,
        ) => {
            const key = String(formData.get("apiKey") ?? "").trim();

            if (!key) {
                return { error: "Enter an admin key." };
            }

            setApiKey(key);
            pushToast("Admin key stored for this browser session.", "success");
            return { error: null };
        },
        { error: null },
    );

    const masked = apiKey.length > 4 ? `••••${apiKey.slice(-4)}` : "••••";

    return (
        <Panel>
            <PanelHeader
                title={
                    <span className="flex items-center gap-2">
                        <KeyIcon className="h-4 w-4 text-slate-400" />
                        Admin key
                    </span>
                }
                description="Required for imports, edits and deprecations. Stored in sessionStorage only."
                action={
                    hasKey ? (
                        <Badge tone="success">
                            <CheckIcon className="h-3 w-3" />
                            Active {masked}
                        </Badge>
                    ) : (
                        <Badge tone="warning">Read-only</Badge>
                    )
                }
            />
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-3 sm:px-5">
                <form action={submit} className="lg:col-span-2">
                    <label htmlFor="admin-key" className={LABEL_CLASS}>
                        {hasKey ? "Replace key" : "Enter key"}
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id="admin-key"
                            name="apiKey"
                            type="password"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="Paste the ADMIN_API_KEY value"
                            className={FIELD_CLASS}
                            required
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={pending}
                            className="shrink-0"
                        >
                            {pending
                                ? "Saving..."
                                : hasKey
                                  ? "Replace key"
                                  : "Unlock writes"}
                        </Button>
                        {hasKey ? (
                            <Button
                                onClick={() => {
                                    clearApiKey();
                                    pushToast("Admin key cleared.", "info");
                                }}
                                className="shrink-0"
                            >
                                Clear
                            </Button>
                        ) : null}
                    </div>
                    {state.error ? (
                        <p
                            role="alert"
                            className="mt-2 text-xs font-medium text-rose-700"
                        >
                            {state.error}
                        </p>
                    ) : null}
                </form>
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs leading-5 text-slate-600">
                        The key is sent as the{" "}
                        <code className="rounded bg-white px-1 py-0.5 text-[11px]">
                            x-api-key
                        </code>{" "}
                        header. It never leaves this browser session and is
                        cleared when the tab closes.
                    </p>
                </div>
            </div>
        </Panel>
    );
}
