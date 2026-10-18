"use client";

import {
    createContext,
    useContext,
    useSyncExternalStore,
    type ReactNode,
} from "react";

const STORAGE_KEY = "bd-geo:admin-key";

const listeners = new Set<() => void>();
let memoryKey = "";

function readKey(): string {
    try {
        const stored = window.sessionStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            return stored;
        }
    } catch {
        // Fall through to the in-memory value.
    }
    return memoryKey;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function emit(): void {
    listeners.forEach((listener) => listener());
}

function writeKey(key: string): void {
    memoryKey = key;
    try {
        if (key) {
            window.sessionStorage.setItem(STORAGE_KEY, key);
        } else {
            window.sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // The in-memory store still updates when storage is unavailable.
    }
    emit();
}

type AdminKeyContextValue = {
    apiKey: string;
    hasKey: boolean;
    setApiKey: (key: string) => void;
    clearApiKey: () => void;
};

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

export function AdminKeyProvider({ children }: { children: ReactNode }) {
    const apiKey = useSyncExternalStore(subscribe, readKey, () => "");

    function setApiKey(key: string) {
        writeKey(key.trim());
    }

    function clearApiKey() {
        writeKey("");
    }

    const value = {
        apiKey,
        hasKey: apiKey.length > 0,
        setApiKey,
        clearApiKey,
    };

    return (
        <AdminKeyContext.Provider value={value}>
            {children}
        </AdminKeyContext.Provider>
    );
}

export function useAdminKey(): AdminKeyContextValue {
    const context = useContext(AdminKeyContext);
    if (!context) {
        throw new Error("useAdminKey must be used within an AdminKeyProvider");
    }
    return context;
}
