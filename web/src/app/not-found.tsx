import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md text-center">
                <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                    404
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                    Page not found
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    That route does not exist in the console. Return to the
                    overview or search the dataset instead.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-lg border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:border-emerald-700 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Overview
                    </Link>
                    <Link
                        href="/search"
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Search records
                    </Link>
                </div>
            </div>
        </div>
    );
}
