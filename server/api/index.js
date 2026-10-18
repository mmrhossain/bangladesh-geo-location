import logger from "../src/shared/logging/logger.js";
import { startTracing } from "../src/shared/observability/tracing.js";

let initialization = null;
let app = null;

function initialize() {
    if (!initialization) {
        initialization = (async () => {
            await startTracing();

            const [
                { default: connectDB },
                { loadSnapshot },
                { startCacheInvalidation },
                { connectRedis },
                { default: expressApp },
            ] = await Promise.all([
                import("../src/shared/config/connectDB.js"),
                import("../src/modules/geography/index.js"),
                import("../src/shared/persistence/cacheEvents.js"),
                import("../src/shared/persistence/redis.js"),
                import("../app.js"),
            ]);

            app = expressApp;

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
        })().catch((error) => {
            initialization = null;
            throw error;
        });
    }

    return initialization;
}

export default async function handler(req, res) {
    try {
        await initialize();
    } catch (error) {
        logger.error({ err: error }, "Serverless initialization failed");
        res.status(503).json({
            status: "error",
            code: "SERVICE_UNAVAILABLE",
            message: "Service initialization failed",
        });
        return;
    }

    return app(req, res);
}
