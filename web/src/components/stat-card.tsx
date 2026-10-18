import type { ComponentType, SVGProps } from "react";
import { formatNumber } from "@/lib/format";

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    loading = false,
}: {
    label: string;
    value: number | null | undefined;
    hint?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    loading?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            {loading ? (
                <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    {formatNumber(value)}
                </p>
            )}
            {hint ? (
                <p className="mt-1 text-xs text-slate-500">{hint}</p>
            ) : null}
        </div>
    );
}
