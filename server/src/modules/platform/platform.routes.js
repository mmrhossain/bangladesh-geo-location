import express from "express";
import * as platformController from "./platform.controller.js";

const router = express.Router();

router.get("/", platformController.getServiceInfo);
router.get("/health", platformController.getHealth);
router.get("/ready", platformController.getReady);
router.get("/metrics", platformController.getMetrics);
router.get("/api/v1/openapi.json", platformController.getOpenApi);

export default router;
