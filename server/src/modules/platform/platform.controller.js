import env from "../../shared/config/env.js";
import {
    metricsContentType,
    metricsText,
} from "../../shared/observability/metrics.js";
import { getSnapshotHealth } from "../geography/index.js";
import openApiSpec from "./openapi.js";

export function getServiceInfo(req, res) {
    res.json({
        status: "success",
        service: "bd-geo-service",
        apiVersion: "v1",
        endpoints: {
            health: "/health",
            ready: "/ready",
            dataset: "/api/v1/meta/dataset",
            docs: "/api/v1",
            openapi: "/api/v1/openapi.json",
        },
    });
}

export function getHealth(req, res) {
    res.json({
        status: "ok",
        uptimeSeconds: Math.round(process.uptime()),
    });
}

export function getReady(req, res) {
    const snapshot = getSnapshotHealth();
    res.status(snapshot.ready ? 200 : 503).json({
        status: snapshot.ready ? "ready" : "not_ready",
        snapshot,
    });
}

export async function getMetrics(req, res, next) {
    try {
        if (!env.METRICS_ENABLED) {
            res.status(404).json({
                status: "fail",
                code: "METRICS_DISABLED",
                message: "Metrics are disabled",
            });
            return;
        }

        if (
            env.METRICS_TOKEN &&
            req.get("authorization") !== `Bearer ${env.METRICS_TOKEN}`
        ) {
            res.status(401).json({
                status: "fail",
                code: "UNAUTHORIZED",
                message: "A valid metrics token is required",
            });
            return;
        }

        res.set(
            "Content-Type",
            metricsContentType ||
                "text/plain; version=0.0.4; charset=utf-8"
        );
        res.set("Cache-Control", "no-store");
        res.send(await metricsText());
    } catch (error) {
        next(error);
    }
}

export function getOpenApi(req, res) {
    res.set("Cache-Control", "public, max-age=300");
    res.json(openApiSpec);
}
