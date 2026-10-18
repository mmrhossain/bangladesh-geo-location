import { CloseIcon, SearchIcon } from "@/components/icons";

export function SearchInput({
    id,
    value,
    onChange,
    placeholder,
    label = "Search",
}: {
    id: string;
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    label?: string;
}) {
    return (
        <div className="w-full">
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    id={id}
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pr-10 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                />
                {value ? (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        aria-label="Clear search"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
