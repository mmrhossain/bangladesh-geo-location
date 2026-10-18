import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<BadgeTone, string> = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function Badge({
    children,
    tone = "neutral",
    className = "",
}: {
    children: ReactNode;
    tone?: BadgeTone;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASS[tone]} ${className}`}
        >
            {children}
        </span>
    );
}
