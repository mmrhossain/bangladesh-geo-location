import { createClient } from "redis";
import env from "../config/env.js";
import logger from "../logging/logger.js";

let client = null;
let connected = false;

export async function connectRedis() {
    if (!env.REDIS_URL) {
        logger.info(
            "REDIS_URL is not set; using in-memory rate limiting and local cache invalidation"
        );
        return null;
    }

    if (client && connected) {
        return client;
    }

    client = createClient({
        url: env.REDIS_URL,
        socket: {
            connectTimeout: 5_000,
            reconnectStrategy: (retries) =>
                retries > 3 ? false : Math.min(retries * 100, 1_000),
        },
    });

    client.on("error", (error) => {
        logger.error({ err: error }, "Redis client error");
    });

    try {
        await client.connect();
        connected = true;
        logger.info("Connected to Redis");
    } catch (error) {
        connected = false;
        logger.error(
            { err: error },
            "Redis connection failed; falling back to in-memory rate limiting"
        );

        try {
            await client.disconnect();
        } catch {
            // Ignore disconnect errors.
        }

        client = null;
    }

    return client;
}

export function getRedisClient() {
    return connected ? client : null;
}

export function isRedisEnabled() {
    return connected;
}

export async function closeRedis() {
    const active = client;
    client = null;
    connected = false;

    if (!active) {
        return;
    }

    try {
        await active.quit();
        logger.info("Redis connection closed");
    } catch (error) {
        logger.error({ err: error }, "Failed to close Redis connection");
    }
}
