import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import logger from "../logging/logger.js";

export function notFound(req, res, next) {
    next(
        AppError.notFound(
            "ROUTE_NOT_FOUND",
            `Route ${req.method} ${req.originalUrl} was not found`
        )
    );
}

export function errorHandler(error, req, res, next) {
    res.set("Cache-Control", "no-store");

    let statusCode = 500;
    let code = "INTERNAL_ERROR";
    let message = "Internal server error";
    let details;

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
    } else if (error instanceof ZodError) {
        statusCode = 400;
        code = "VALIDATION_ERROR";
        message = "Invalid request";
        details = error.flatten();
    } else if (error instanceof mongoose.Error.CastError) {
        statusCode = 400;
        code = "INVALID_IDENTIFIER";
        message = "The provided identifier is not valid";
    } else if (error?.code === 11000) {
        statusCode = 409;
        code = "DUPLICATE_RESOURCE";
        message = "A resource with the same unique fields already exists";
        details = error.keyValue;
    } else if (error?.type === "entity.too.large") {
        statusCode = 413;
        code = "PAYLOAD_TOO_LARGE";
        message = "Request body is too large";
    } else if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        Object.prototype.hasOwnProperty.call(error, "body")
    ) {
        statusCode = 400;
        code = "INVALID_JSON";
        message = "Request body contains invalid JSON";
    }

    if (statusCode >= 500) {
        logger.error(
            { err: error, requestId: req.id },
            "Unhandled request error"
        );
    }

    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        code,
        message,
        ...(details ? { details } : {}),
        requestId: req.id,
    });
}
