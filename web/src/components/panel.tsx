import type { ReactNode } from "react";

export function Panel({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] ${className}`}
        >
            {children}
        </section>
    );
}

export function PanelHeader({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
