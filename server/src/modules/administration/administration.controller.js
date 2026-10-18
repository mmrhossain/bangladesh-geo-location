import { asyncHandler } from "../../shared/http/asyncHandler.js";
import logger from "../../shared/logging/logger.js";
import { adminWritesTotal } from "../../shared/observability/metrics.js";
import * as adminService from "./administration.service.js";

export const importDataset = asyncHandler(async (req, res) => {
    const summary = await adminService.importDataset(req.validated.body);
    adminWritesTotal.inc({ action: "import", resource: "dataset" });

    logger.info(
        {
            requestId: req.id,
            action: "admin.dataset.import",
            datasetVersion: summary.datasetVersion,
            counts: summary.counts,
        },
        "Admin dataset import completed"
    );

    res.status(200).json({ status: "success", data: summary });
});

export const updateEntity = asyncHandler(async (req, res) => {
    const { resource, code } = req.validated.params;
    const entity = await adminService.updateEntity(
        resource,
        code,
        req.validated.body
    );
    adminWritesTotal.inc({ action: "update", resource });

    logger.info(
        {
            requestId: req.id,
            action: "admin.entity.update",
            resource,
            code,
        },
        "Admin entity updated"
    );

    res.json({ status: "success", data: entity });
});

export const deprecateEntity = asyncHandler(async (req, res) => {
    const { resource, code } = req.validated.params;
    const { deprecated } = req.validated.body;
    const entity = await adminService.deprecateEntity(
        resource,
        code,
        deprecated
    );
    adminWritesTotal.inc({ action: "deprecate", resource });

    logger.info(
        {
            requestId: req.id,
            action: "admin.entity.deprecate",
            resource,
            code,
            deprecated,
        },
        "Admin entity deprecation changed"
    );

    res.json({ status: "success", data: entity });
});
