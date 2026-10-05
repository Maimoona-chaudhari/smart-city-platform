import { Router } from "express";

import { getMapData } from "../controllers/gisController";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/map-data",
  protect,
  authorize("SUPER_ADMIN"),
  getMapData
);

export default router;