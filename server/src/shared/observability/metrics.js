import {
    Counter,
    Gauge,
    Histogram,
    Registry,
    collectDefaultMetrics,
} from "@prometheus-io/client";

export const registry = new Registry();

collectDefaultMetrics({ register: registry, prefix: "bd_geo_" });

const httpLabels = ["method", "route", "status_code"];

export const httpRequestsTotal = new Counter({
    name: "bd_geo_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: httpLabels,
    registers: [registry],
});

export const httpRequestDuration = new Histogram({
    name: "bd_geo_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: httpLabels,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
});

export const cacheReadyGauge = new Gauge({
    name: "bd_geo_cache_ready",
    help: "Whether the geography snapshot is loaded and non-empty",
    registers: [registry],
});

export const cacheEntityGauge = new Gauge({
    name: "bd_geo_cache_entities",
    help: "Number of entities held in the geography snapshot",
    labelNames: ["entity"],
    registers: [registry],
});

export const datasetImportDuration = new Histogram({
    name: "bd_geo_dataset_import_duration_seconds",
    help: "Dataset import duration in seconds",
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
    registers: [registry],
});

export const datasetImportsTotal = new Counter({
    name: "bd_geo_dataset_imports_total",
    help: "Total number of dataset imports by outcome",
    labelNames: ["status"],
    registers: [registry],
});

export const adminWritesTotal = new Counter({
    name: "bd_geo_admin_writes_total",
    help: "Total number of admin write operations",
    labelNames: ["action", "resource"],
    registers: [registry],
});

export function metricsMiddleware(req, res, next) {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e9;
        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : "unmatched";
        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode),
        };

        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, duration);
    });

    next();
}

export function metricsText() {
    return registry.metrics();
}

export const metricsContentType = registry.contentType;
