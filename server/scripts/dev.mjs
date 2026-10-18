import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(serverRoot, "..");
const webRoot = path.join(repoRoot, "web");
const apiPort = process.env.PORT ?? "4000";
const webMode = process.env.WEB_MODE ?? "development";
const adminKey =
    process.env.DEV_ADMIN_API_KEY ?? "dev-admin-key-change-me-123456";

const children = new Set();
let mongo = null;
let stopping = false;

function spawnChild(command, args, env, cwd = serverRoot) {
    const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: "inherit",
        detached: true,
    });

    children.add(child);

    child.on("exit", (code, signal) => {
        children.delete(child);

        if (!stopping) {
            console.error(
                `[dev] ${command} exited (${signal ?? code ?? "unknown"})`
            );
            void shutdown(code ?? 1);
        }
    });

    return child;
}

function runToCompletion(command, args, env, cwd = serverRoot) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env: { ...process.env, ...env },
            stdio: "inherit",
        });

        child.once("error", reject);
        child.once("exit", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`${command} exited with code ${code}`));
        });
    });
}

function killChild(child) {
    try {
        process.kill(-child.pid, "SIGTERM");
    } catch {
        child.kill("SIGTERM");
    }
}

async function hasWebDependencies() {
    try {
        await access(
            path.join(webRoot, "node_modules", "next", "package.json")
        );
        return true;
    } catch {
        return false;
    }
}

async function waitForApi(url, timeoutMs) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return;
            }
        } catch {
            // The API is still starting.
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    throw new Error(`API did not become ready at ${url}`);
}

async function shutdown(code = 0) {
    if (stopping) {
        return;
    }

    stopping = true;
    console.log("[dev] Shutting down...");

    for (const child of children) {
        killChild(child);
    }

    if (mongo) {
        await mongo.stop();
        mongo = null;
    }

    process.exit(code);
}

async function main() {
    if (!process.env.MONGODB_URL) {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        mongo = await MongoMemoryServer.create({
            instance: { dbName: "bd_geo_dev" },
        });
        console.log("[dev] Started in-memory MongoDB");
    }

    const mongoUrl = process.env.MONGODB_URL ?? mongo.getUri();
    const apiEnv = {
        NODE_ENV: "development",
        PORT: apiPort,
        MONGODB_URL: mongoUrl,
        ADMIN_API_KEY: adminKey,
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
        CORS_ORIGINS: "*",
        TRUST_PROXY: "true",
    };

    console.log("[dev] Seeding the dataset...");
    await runToCompletion(process.execPath, ["src/scripts/seed.js"], apiEnv);

    spawnChild(
        process.execPath,
        ["--watch", "--import", "./src/shared/observability/tracing-preload.js", "index.js"],
        apiEnv
    );

    await waitForApi(`http://127.0.0.1:${apiPort}/ready`, 60_000);

    if (!(await hasWebDependencies())) {
        console.log("[dev] Installing web dependencies...");
        await runToCompletion(
            "npm",
            ["--prefix", webRoot, "install", "--no-audit", "--no-fund"],
            {},
            repoRoot
        );
    }

    const webEnv = {
        API_PROXY_URL: `http://127.0.0.1:${apiPort}`,
        NEXT_TELEMETRY_DISABLED: "1",
    };

    if (webMode === "production") {
        console.log("[dev] Building the console...");
        await runToCompletion(
            "npm",
            ["--prefix", webRoot, "run", "build"],
            webEnv,
            repoRoot
        );
        spawnChild("npm", ["--prefix", webRoot, "run", "start"], webEnv, repoRoot);
    } else {
        spawnChild("npm", ["--prefix", webRoot, "run", "dev"], webEnv, repoRoot);
    }

    console.log(`[dev] API: http://127.0.0.1:${apiPort}`);
    console.log(`[dev] Console (${webMode}): http://127.0.0.1:3000`);
    console.log(`[dev] Admin key: ${adminKey}`);
}

process.on("SIGINT", () => {
    void shutdown(0);
});
process.on("SIGTERM", () => {
    void shutdown(0);
});

main().catch(async (error) => {
    console.error(`[dev] ${error.message}`);
    await shutdown(1);
});
