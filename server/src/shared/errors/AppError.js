export class AppError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.expose = true;
        Error.captureStackTrace?.(this, AppError);
    }

    static badRequest(code, message, details) {
        return new AppError(400, code, message, details);
    }

    static unauthorized(code, message, details) {
        return new AppError(401, code, message, details);
    }

    static forbidden(code, message, details) {
        return new AppError(403, code, message, details);
    }

    static notFound(code, message, details) {
        return new AppError(404, code, message, details);
    }

    static conflict(code, message, details) {
        return new AppError(409, code, message, details);
    }

    static serviceUnavailable(code, message, details) {
        return new AppError(503, code, message, details);
    }
}

export default AppError;
