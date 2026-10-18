"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/lib/navigation";

export function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
        >
            <ul className="grid grid-cols-6">
                {NAV_ITEMS.map((item) => {
                    const active = isNavItemActive(pathname, item.href);
                    const ItemIcon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                className={`flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600 ${
                                    active
                                        ? "text-emerald-700"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                <ItemIcon className="h-5 w-5" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
