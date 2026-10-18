import "dotenv/config";
import { z } from "zod";

const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        PORT: z.coerce.number().int().min(1).max(65535).default(4000),
        MONGODB_URL: z.string().min(1, "MONGODB_URL is required"),
        MAX_JSON_SIZE: z.string().min(1).default("100kb"),
        ADMIN_IMPORT_MAX_SIZE: z.string().min(1).default("5mb"),
        CORS_ORIGINS: z.string().default("*"),
        ADMIN_API_KEY: z.string().min(16).optional(),
        RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
        RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
        TRUST_PROXY: z
            .enum(["true", "false"])
            .default("false")
            .transform((value) => value === "true"),
        LOG_LEVEL: z
            .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
            .default("info"),
        DATASET_VERSION: z.string().min(1).default("1.0.0"),
        METRICS_ENABLED: z
            .enum(["true", "false"])
            .default("true")
            .transform((value) => value === "true"),
        METRICS_TOKEN: z.string().min(16).optional(),
        REDIS_URL: z.string().url().optional(),
        REDIS_KEY_PREFIX: z.string().trim().min(1).max(64).default("bd-geo"),
        CACHE_INVALIDATION_CHANNEL: z
            .string()
            .trim()
            .min(1)
            .max(128)
            .default("bd-geo:cache:invalidate"),
        OTEL_ENABLED: z
            .enum(["true", "false"])
            .default("false")
            .transform((value) => value === "true"),
        OTEL_SERVICE_NAME: z
            .string()
            .trim()
            .min(1)
            .max(128)
            .default("bd-geo-service"),
        OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    })
    .superRefine((value, ctx) => {
        if (value.NODE_ENV === "production" && !value.ADMIN_API_KEY) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["ADMIN_API_KEY"],
                message: "ADMIN_API_KEY is required in production",
            });
        }
    });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

const data = parsed.data;

export const env = Object.freeze({
    ...data,
    isProduction: data.NODE_ENV === "production",
    corsOrigins: data.CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
});

export default env;
