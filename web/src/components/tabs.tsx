"use client";

type TabOption<T extends string> = {
    value: T;
    label: string;
    count?: number;
};

export function Tabs<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
}: {
    options: TabOption<T>[];
    value: T;
    onChange: (next: T) => void;
    ariaLabel: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                            selected
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                    >
                        {option.label}
                        {typeof option.count === "number" ? (
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                                    selected
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                {option.count}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
