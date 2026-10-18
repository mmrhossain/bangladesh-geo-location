import { CopyButton } from "@/components/copy-button";

export function CodeBlock({
    code,
    caption,
}: {
    code: string;
    caption?: string;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
                <p className="truncate text-xs font-medium text-slate-400">
                    {caption ?? "Request"}
                </p>
                <CopyButton
                    value={code}
                    className="text-slate-400 hover:bg-white/10 hover:text-white"
                />
            </div>
            <pre className="overflow-x-auto px-3 py-3 text-xs leading-6 text-slate-100">
                <code>{code}</code>
            </pre>
        </div>
    );
}
