import env from "../config/env.js";
import logger from "../logging/logger.js";

let sdk = null;
let starting = null;

export function isTracingEnabled() {
    return env.OTEL_ENABLED;
}

export function isTracingActive() {
    return sdk !== null;
}

export async function startTracing() {
    if (!env.OTEL_ENABLED) {
        return false;
    }

    if (sdk) {
        return true;
    }

    if (starting) {
        return starting;
    }

    starting = (async () => {
        try {
            const [
                { NodeSDK },
                { OTLPTraceExporter },
                { HttpInstrumentation },
                { ExpressInstrumentation },
                { MongoDBInstrumentation },
                { RedisInstrumentation },
                { resourceFromAttributes },
            ] = await Promise.all([
                import("@opentelemetry/sdk-node"),
                import("@opentelemetry/exporter-trace-otlp-http"),
                import("@opentelemetry/instrumentation-http"),
                import("@opentelemetry/instrumentation-express"),
                import("@opentelemetry/instrumentation-mongodb"),
                import("@opentelemetry/instrumentation-redis"),
                import("@opentelemetry/resources"),
            ]);

            const ignoredPaths = new Set(["/health", "/ready", "/metrics"]);

            sdk = new NodeSDK({
                resource: resourceFromAttributes({
                    "service.name": env.OTEL_SERVICE_NAME,
                    "deployment.environment.name": env.NODE_ENV,
                }),
                traceExporter: new OTLPTraceExporter(),
                instrumentations: [
                    new HttpInstrumentation({
                        ignoreIncomingRequestHook: (request) =>
                            ignoredPaths.has(request.url),
                    }),
                    new ExpressInstrumentation(),
                    new MongoDBInstrumentation(),
                    new RedisInstrumentation(),
                ],
            });

            await sdk.start();
            logger.info(
                { serviceName: env.OTEL_SERVICE_NAME },
                "OpenTelemetry tracing started"
            );

            return true;
        } catch (error) {
            sdk = null;
            logger.error(
                { err: error },
                "OpenTelemetry initialization failed; continuing without tracing"
            );
            return false;
        } finally {
            starting = null;
        }
    })();

    return starting;
}

export async function shutdownTracing() {
    if (!sdk) {
        return;
    }

    try {
        await sdk.shutdown();
        logger.info("OpenTelemetry tracing stopped");
    } catch (error) {
        logger.error({ err: error }, "Failed to stop OpenTelemetry tracing");
    } finally {
        sdk = null;
    }
}
