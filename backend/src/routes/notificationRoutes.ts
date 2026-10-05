import { Router } from "express";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  protect,
  getMyNotifications
);

router.patch(
  "/:id/read",
  protect,
  markNotificationAsRead
);

router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);

export default router;