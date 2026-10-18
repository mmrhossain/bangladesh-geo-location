import { timingSafeEqual } from "node:crypto";
import env from "../config/env.js";
import { AppError } from "../errors/AppError.js";

function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
}

export function requireAdmin(req, res, next) {
    if (!env.ADMIN_API_KEY) {
        return next(
            AppError.serviceUnavailable(
                "ADMIN_DISABLED",
                "Admin API is not configured on this instance"
            )
        );
    }

    const apiKey =
        req.get("x-api-key") ||
        (req.get("authorization") || "").replace(/^Bearer\s+/i, "");

    if (!apiKey || !safeEqual(apiKey, env.ADMIN_API_KEY)) {
        return next(
            AppError.unauthorized(
                "UNAUTHORIZED",
                "A valid admin API key is required"
            )
        );
    }

    next();
}

export default requireAdmin;
