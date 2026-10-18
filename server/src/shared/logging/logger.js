import pino from "pino";
import env from "../config/env.js";

const logger = pino({
    level: env.LOG_LEVEL,
    base: {
        service: "bd-geo-service",
        env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers['x-api-key']",
            "*.password",
            "*.apiKey",
        ],
        censor: "[redacted]",
    },
});

export default logger;
