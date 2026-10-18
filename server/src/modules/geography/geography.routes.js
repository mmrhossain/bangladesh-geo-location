import express from "express";
import * as locationController from "./geography.controller.js";
import { cachePublic } from "../../shared/http/cacheControl.js";
import { validate } from "../../shared/http/validate.js";
import {
    codeParamSchema,
    hierarchyQuerySchema,
    listQuerySchema,
    searchQuerySchema,
} from "./geography.schemas.js";

const router = express.Router();

router.use(cachePublic(300));

router.get(
    "/divisions",
    validate(listQuerySchema, "query"),
    locationController.listDivisions
);
router.get(
    "/divisions/:code",
    validate(codeParamSchema, "params"),
    locationController.getDivision
);
router.get(
    "/divisions/:code/districts",
    validate(codeParamSchema, "params"),
    validate(listQuerySchema, "query"),
    locationController.listDistricts
);

router.get(
    "/districts",
    validate(listQuerySchema, "query"),
    locationController.listDistrictsGlobal
);
router.get(
    "/districts/:code",
    validate(codeParamSchema, "params"),
    locationController.getDistrict
);
router.get(
    "/districts/:code/upazilas",
    validate(codeParamSchema, "params"),
    validate(listQuerySchema, "query"),
    locationController.listUpazilas
);

router.get(
    "/upazilas",
    validate(listQuerySchema, "query"),
    locationController.listUpazilasGlobal
);
router.get(
    "/upazilas/:code",
    validate(codeParamSchema, "params"),
    locationController.getUpazila
);
router.get(
    "/upazilas/:code/unions",
    validate(codeParamSchema, "params"),
    validate(listQuerySchema, "query"),
    locationController.listUnions
);

router.get(
    "/unions",
    validate(listQuerySchema, "query"),
    locationController.listUnionsGlobal
);
router.get(
    "/unions/:code",
    validate(codeParamSchema, "params"),
    locationController.getUnion
);

router.get(
    "/post-offices",
    validate(listQuerySchema, "query"),
    locationController.listPostOffices
);
router.get(
    "/post-offices/:code",
    validate(codeParamSchema, "params"),
    locationController.getPostOffice
);

router.get(
    "/hierarchy",
    validate(hierarchyQuerySchema, "query"),
    locationController.getHierarchy
);
router.get(
    "/search",
    validate(searchQuerySchema, "query"),
    locationController.search
);
router.get("/meta/dataset", locationController.getDatasetMeta);

export default router;
