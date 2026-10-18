import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primary:
        "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700",
    secondary:
        "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
    ghost:
        "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger:
        "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "sm" | "md";
    children: ReactNode;
};

export function Button({
    variant = "secondary",
    size = "md",
    className = "",
    children,
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
            } ${VARIANT_CLASS[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
