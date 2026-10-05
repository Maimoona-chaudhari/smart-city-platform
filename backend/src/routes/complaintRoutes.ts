import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  createComplaint,
  updateComplaintStatus,
  getMyComplaints,
  assignComplaint,
  getAssignedComplaints,
  getDepartmentComplaints,
  getAllComplaints,
  getComplaintById,
} from "../controllers/complaintController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import upload from "../middleware/uploadMiddleware";

const router = Router();

// Runs multer and returns clean JSON errors
// (file too large / wrong file type)
const handleEvidenceUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single("evidence")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5MB or smaller"
            : err.message,
      });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({
        message: err.message,
      });
      return;
    }

    next();
  });
};

router.post(
  "/",
  protect,
  handleEvidenceUpload,
  createComplaint
);
router.get("/my", protect, getMyComplaints);
router.patch("/:id/assign", protect, authorize("SUPER_ADMIN"), assignComplaint);
router.patch("/:id/status", protect, authorize("OFFICER", "SUPER_ADMIN"), updateComplaintStatus);
router.get(
  "/all",
  protect,
  authorize("SUPER_ADMIN"),
  getAllComplaints
);
router.get(
  "/department",
  protect,
  getDepartmentComplaints
);
router.get("/:id", protect, getComplaintById);
export default router;