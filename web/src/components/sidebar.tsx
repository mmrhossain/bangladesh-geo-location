"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, MapPinIcon } from "@/components/icons";
import { isNavItemActive, NAV_ITEMS } from "@/lib/navigation";

type SidebarProps = {
    onNavigate?: () => void;
    showClose?: boolean;
};

export function Sidebar({ onNavigate, showClose = false }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex items-center gap-3 px-5 py-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <MapPinIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
                        BD Geo Console
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        Bangladesh geography API
                    </p>
                </div>
                {showClose ? (
                    <button
                        type="button"
                        onClick={onNavigate}
                        aria-label="Close navigation"
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
                {NAV_ITEMS.map((item) => {
                    const active = isNavItemActive(pathname, item.href);
                    const ItemIcon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                                active
                                    ? "bg-emerald-50 text-emerald-900"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <ItemIcon
                                className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                                    active
                                        ? "text-emerald-700"
                                        : "text-slate-400 group-hover:text-slate-600"
                                }`}
                            />
                            <span className="min-w-0">
                                <span className="block font-medium">{item.label}</span>
                                <span
                                    className={`mt-0.5 block text-xs leading-4 ${
                                        active ? "text-emerald-700/80" : "text-slate-500"
                                    }`}
                                >
                                    {item.description}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 px-5 py-4">
                <p className="text-xs font-medium text-slate-700">Read-only snapshot</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                    Administrative writes require an admin key. The key is kept in this
                    browser session only.
                </p>
            </div>
        </div>
    );
}
