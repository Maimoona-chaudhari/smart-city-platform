import { Router } from "express";

import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  deleteWorkflow,
} from "../controllers/workflowController";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  protect,
  authorize("SUPER_ADMIN"),
  getWorkflows
);

router.get(
  "/:id",
  protect,
  authorize("SUPER_ADMIN"),
  getWorkflowById
);

router.post(
  "/",
  protect,
  authorize("SUPER_ADMIN"),
  createWorkflow
);

router.delete(
  "/:id",
  protect,
  authorize("SUPER_ADMIN"),
  deleteWorkflow
);

export default router;