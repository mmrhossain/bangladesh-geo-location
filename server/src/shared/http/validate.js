import { AppError } from "../errors/AppError.js";

export function validate(schema, source = "body") {
    return function validateRequest(req, res, next) {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            return next(
                AppError.badRequest(
                    "VALIDATION_ERROR",
                    "Invalid request",
                    result.error.flatten()
                )
            );
        }

        req.validated = req.validated || {};
        req.validated[source] = result.data;
        next();
    };
}

export default validate;
