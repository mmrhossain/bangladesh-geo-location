"use client";

import Link from "next/link";
import { AlertIcon, RefreshIcon } from "@/components/icons";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <AlertIcon className="h-6 w-6" />
                </span>
                <h1 className="mt-4 text-xl font-semibold text-slate-900">
                    This view failed to load
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    {error.message ||
                        "An unexpected error occurred while rendering the console."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:border-emerald-700 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        <RefreshIcon className="h-4 w-4" />
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Back to overview
                    </Link>
                </div>
            </div>
        </div>
    );
}
