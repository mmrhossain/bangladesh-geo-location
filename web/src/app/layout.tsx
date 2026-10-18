import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "BD Geo Console",
        template: "%s | BD Geo Console",
    },
    description:
        "Explore and maintain Bangladesh administrative geography: divisions, districts, upazilas, unions and post offices.",
    applicationName: "BD Geo Console",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#059669",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body>
                <Providers>
                    <AppShell>{children}</AppShell>
                </Providers>
            </body>
        </html>
    );
}
