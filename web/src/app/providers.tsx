"use client";

import type { ReactNode } from "react";
import { AdminKeyProvider } from "@/components/admin-key-provider";
import { ToastProvider } from "@/components/toast-provider";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AdminKeyProvider>
            <ToastProvider>{children}</ToastProvider>
        </AdminKeyProvider>
    );
}
