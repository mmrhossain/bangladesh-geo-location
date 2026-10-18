import mongoose from "mongoose";
import { loadSnapshot } from "./src/modules/geography/index.js";
import env from "./src/shared/config/env.js";
import connectDB from "./src/shared/config/connectDB.js";
import {
    startCacheInvalidation,
    stopCacheInvalidation,
} from "./src/shared/persistence/cacheEvents.js";
import logger from "./src/shared/logging/logger.js";
import { closeRedis, connectRedis } from "./src/shared/persistence/redis.js";
import { shutdownTracing, startTracing } from "./src/shared/observability/tracing.js";

let server;
let shuttingDown = false;

async function start() {
    await startTracing();
    await connectDB();
    await loadSnapshot();

    try {
        await connectRedis();
        await startCacheInvalidation(() => loadSnapshot());
    } catch (error) {
        logger.error(
            { err: error },
            "Redis integration failed; continuing with local cache invalidation"
        );
    }

    const { default: app } = await import("./app.js");

    server = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, "bd-geo-service is listening");
    });

    server.requestTimeout = 60_000;
    server.headersTimeout = 66_000;
    server.keepAliveTimeout = 65_000;
}

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    logger.info({ signal }, "Shutting down");

    const finish = async (exitCode) => {
        try {
            await stopCacheInvalidation();
            await closeRedis();
            await mongoose.connection.close();
            await shutdownTracing();
        } catch (error) {
            logger.error({ err: error }, "Failed to close connections");
        }

        logger.info("Shutdown complete");
        process.exit(exitCode);
    };

    if (!server) {
        await finish(0);
        return;
    }

    server.close((error) => {
        if (error) {
            logger.error({ err: error }, "Error while closing HTTP server");
        }
        finish(error ? 1 : 0);
    });

    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught exception");
    shutdown("uncaughtException");
});

start().catch((error) => {
    logger.fatal({ err: error }, "Failed to start service");
    process.exit(1);
});
