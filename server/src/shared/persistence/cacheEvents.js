import { randomUUID } from "node:crypto";
import env from "../config/env.js";
import logger from "../logging/logger.js";
import { getRedisClient } from "./redis.js";

const instanceId = randomUUID();

let subscriber = null;
let invalidateHandler = null;

export function getInstanceId() {
    return instanceId;
}

export async function startCacheInvalidation(onInvalidate) {
    invalidateHandler = onInvalidate;

    const client = getRedisClient();

    if (!client) {
        logger.info("Cache invalidation pub/sub disabled (Redis is not connected)");
        return false;
    }

    if (subscriber) {
        return true;
    }

    subscriber = client.duplicate();
    subscriber.on("error", (error) => {
        logger.error({ err: error }, "Redis subscriber error");
    });

    await subscriber.connect();
    await subscriber.subscribe(env.CACHE_INVALIDATION_CHANNEL, async (message) => {
        try {
            const payload = JSON.parse(message);

            if (payload?.instanceId === instanceId) {
                return;
            }

            logger.info(
                {
                    reason: payload?.reason,
                    sourceInstance: payload?.instanceId,
                },
                "Received cache invalidation"
            );

            await invalidateHandler?.();
        } catch (error) {
            logger.error(
                { err: error },
                "Failed to handle cache invalidation message"
            );
        }
    });

    logger.info(
        { channel: env.CACHE_INVALIDATION_CHANNEL },
        "Cache invalidation subscriber started"
    );

    return true;
}

export async function publishCacheInvalidation(reason) {
    const client = getRedisClient();

    if (!client) {
        return false;
    }

    try {
        await client.publish(
            env.CACHE_INVALIDATION_CHANNEL,
            JSON.stringify({
                instanceId,
                reason,
                at: new Date().toISOString(),
            })
        );
        return true;
    } catch (error) {
        logger.error({ err: error }, "Failed to publish cache invalidation");
        return false;
    }
}

export async function stopCacheInvalidation() {
    const active = subscriber;
    subscriber = null;

    if (!active) {
        return;
    }

    try {
        await active.unsubscribe(env.CACHE_INVALIDATION_CHANNEL);
        await active.quit();
        logger.info("Cache invalidation subscriber stopped");
    } catch (error) {
        logger.error(
            { err: error },
            "Failed to stop cache invalidation subscriber"
        );
    }
}
