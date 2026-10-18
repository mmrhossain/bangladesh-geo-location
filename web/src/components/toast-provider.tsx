"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    AlertIcon,
    CheckIcon,
    CloseIcon,
} from "@/components/icons";

export type ToastTone = "success" | "error" | "info";

type Toast = {
    id: number;
    message: string;
    tone: ToastTone;
};

type ToastContextValue = {
    pushToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CLASS: Record<ToastTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-white text-slate-900",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);
    const timers = useRef(new Map<number, number>());

    function dismiss(id: number) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            window.clearTimeout(timer);
            timers.current.delete(id);
        }
    }

    function pushToast(message: string, tone: ToastTone = "info") {
        const id = nextId.current++;
        setToasts((current) => [...current.slice(-3), { id, message, tone }]);
        const timer = window.setTimeout(() => dismiss(id), 4500);
        timers.current.set(id, timer);
    }

    useEffect(() => {
        const currentTimers = timers.current;
        return () => {
            currentTimers.forEach((timer) => window.clearTimeout(timer));
            currentTimers.clear();
        };
    }, []);

    const value = { pushToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end lg:bottom-6"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5 ${TONE_CLASS[toast.tone]}`}
                    >
                        {toast.tone === "success" ? (
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : toast.tone === "error" ? (
                            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : null}
                        <p className="min-w-0 flex-1 text-sm leading-5 break-words">
                            {toast.message}
                        </p>
                        <button
                            type="button"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss notification"
                            className="rounded-md p-0.5 opacity-60 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
