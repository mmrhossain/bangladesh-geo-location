import express from "express";
import requireAdmin from "./shared/security/requireAdmin.js";
import adminRoutes from "./modules/administration/administration.routes.js";
import publicRoutes from "./modules/geography/geography.routes.js";

const router = express.Router();

router.use("/admin", requireAdmin, adminRoutes);
router.use("/", publicRoutes);

export default router;
