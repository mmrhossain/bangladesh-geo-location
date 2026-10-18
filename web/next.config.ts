import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const apiUrl = (
    process.env.API_PROXY_URL ?? "http://127.0.0.1:4000"
).replace(/\/+$/, "");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
    reactStrictMode: true,
    reactCompiler: true,
    poweredByHeader: false,
    allowedDevOrigins: ["*.monkeycode-ai.live"],
    turbopack: {
        root: projectRoot,
    },
    async rewrites() {
        return [
            { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
            { source: "/health", destination: `${apiUrl}/health` },
            { source: "/ready", destination: `${apiUrl}/ready` },
            { source: "/metrics", destination: `${apiUrl}/metrics` },
        ];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Referrer-Policy", value: "same-origin" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
