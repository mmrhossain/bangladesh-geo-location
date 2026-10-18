import type { ReactNode } from "react";

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
};

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
