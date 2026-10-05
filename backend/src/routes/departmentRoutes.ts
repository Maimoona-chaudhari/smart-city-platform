import { Router } from "express";
import {
  createDepartment,
  getDepartments,
} from "../controllers/departmentController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, authorize("SUPER_ADMIN"), createDepartment);

router.get("/", protect, getDepartments);

export default router;