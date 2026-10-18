"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

export function CopyButton({
    value,
    label = "Copy",
    className = "",
}: {
    value: string;
    label?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current !== null) {
                window.clearTimeout(timer.current);
            }
        };
    }, []);

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (timer.current !== null) {
                window.clearTimeout(timer.current);
            }
            timer.current = window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                copied
                    ? "text-emerald-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            } ${className}`}
            aria-label={copied ? "Copied" : label}
        >
            {copied ? (
                <CheckIcon className="h-3.5 w-3.5" />
            ) : (
                <CopyIcon className="h-3.5 w-3.5" />
            )}
            <span aria-live="polite">{copied ? "Copied" : label}</span>
        </button>
    );
}
