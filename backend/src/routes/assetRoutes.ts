import { Router } from "express";
import {
  createAsset,
  getAssets,
  updateAssetStatus,
} from "../controllers/assetController";
import { protect, authorize  } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  protect,
  authorize("SUPER_ADMIN"),
  createAsset
);
router.get("/", protect, getAssets);

router.patch(
  "/:id/status",
  protect,
  authorize("SUPER_ADMIN", "OFFICER"),
  updateAssetStatus
);

export default router;