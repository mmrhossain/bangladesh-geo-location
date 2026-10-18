import { randomUUID } from "node:crypto";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import pinoHttp from "pino-http";
import env from "./src/shared/config/env.js";
import { AppError } from "./src/shared/errors/AppError.js";
import logger from "./src/shared/logging/logger.js";
import { metricsMiddleware } from "./src/shared/observability/metrics.js";
import { errorHandler, notFound } from "./src/shared/http/errorHandler.js";
import { getApiLimiter } from "./src/shared/security/rateLimit.js";
import apiRoutes from "./src/api.routes.js";
import platformRoutes from "./src/modules/platform/platform.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY ? 1 : false);

app.use(
    pinoHttp({
        logger,
        genReqId: (req, res) => {
            const requestId = req.headers["x-request-id"] || randomUUID();
            res.setHeader("x-request-id", requestId);
            return requestId;
        },
        autoLogging: {
            ignore: (req) =>
                req.url === "/health" ||
                req.url === "/ready" ||
                req.url === "/metrics",
        },
    })
);

app.use(metricsMiddleware);

app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
    })
);

function buildCorsOptions() {
    if (env.corsOrigins.includes("*")) {
        return { origin: "*", credentials: false };
    }

    return {
        origin(origin, callback) {
            if (!origin || env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                AppError.forbidden(
                    "CORS_ORIGIN_DENIED",
                    "Origin is not allowed"
                )
            );
        },
        credentials: false,
    };
}

app.use(cors(buildCorsOptions()));
app.use(compression());
app.use(
    "/api/v1/admin/import",
    express.json({ limit: env.ADMIN_IMPORT_MAX_SIZE })
);
app.use(express.json({ limit: env.MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true, limit: env.MAX_JSON_SIZE }));
app.use(hpp());
app.use(getApiLimiter());

app.use(platformRoutes);

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
