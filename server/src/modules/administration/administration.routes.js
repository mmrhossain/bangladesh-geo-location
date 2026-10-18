import express from "express";
import * as adminController from "./administration.controller.js";
import { validate } from "../../shared/http/validate.js";
import { importSchema } from "../geography/index.js";
import {
    deprecateEntitySchema,
    resourceParamSchema,
    updateEntitySchema,
} from "./administration.schemas.js";

const router = express.Router();

router.post(
    "/import",
    validate(importSchema),
    adminController.importDataset
);

router.patch(
    "/:resource/:code",
    validate(resourceParamSchema, "params"),
    validate(updateEntitySchema),
    adminController.updateEntity
);

router.post(
    "/:resource/:code/deprecate",
    validate(resourceParamSchema, "params"),
    validate(deprecateEntitySchema),
    adminController.deprecateEntity
);

export default router;
