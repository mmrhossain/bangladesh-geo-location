import type { ReactNode } from "react";
import { AlertIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/button";

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
    return (
        <div
            role="status"
            aria-label={label}
            className="space-y-3 p-5"
        >
            <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function ErrorBlock({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-sm leading-6 text-rose-800">{message}</p>
            </div>
            {onRetry ? (
                <Button size="sm" onClick={onRetry} className="shrink-0">
                    <RefreshIcon className="h-3.5 w-3.5" />
                    Retry
                </Button>
            ) : null}
        </div>
    );
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {description ? (
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
