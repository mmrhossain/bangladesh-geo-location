import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import env from "../config/env.js";
import logger from "../logging/logger.js";
import { getRedisClient } from "../persistence/redis.js";

function createStore() {
    const client = getRedisClient();

    if (!client) {
        return null;
    }

    return new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
        prefix: `${env.REDIS_KEY_PREFIX}:ratelimit:`,
    });
}

export function createApiLimiter() {
    const store = createStore();

    const limiter = rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skip: (req) =>
            req.path === "/health" ||
            req.path === "/ready" ||
            req.path === "/metrics",
        handler: (req, res) => {
            res.status(429).json({
                status: "fail",
                code: "RATE_LIMITED",
                message: "Too many requests, please try again later",
                requestId: req.id,
            });
        },
        ...(store ? { store } : {}),
    });

    logger.info(
        store
            ? "Rate limiting uses Redis"
            : "Rate limiting uses the in-memory store"
    );

    return limiter;
}

let apiLimiter = null;

export function getApiLimiter() {
    if (!apiLimiter) {
        apiLimiter = createApiLimiter();
    }

    return apiLimiter;
}

export default getApiLimiter;
