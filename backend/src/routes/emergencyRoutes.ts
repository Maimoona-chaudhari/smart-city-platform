import { Router } from "express";
import {
  createEmergency,
  getEmergencies,
  assignEmergency,
  updateEmergencyStatus,
} from "../controllers/emergencyController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";

const router = Router();

// Any logged-in user can report an emergency
router.post("/", protect, createEmergency);

// Citizen: own, Officer: assigned/department, Admin: all
router.get("/", protect, getEmergencies);

// Admin dispatches an emergency to an officer
router.patch(
  "/:id/assign",
  protect,
  authorize("SUPER_ADMIN"),
  assignEmergency
);

// Only officers can update status (controller checks it is their emergency)
router.patch(
  "/:id/status",
  protect,
  authorize("OFFICER"),
  updateEmergencyStatus
);

export default router;