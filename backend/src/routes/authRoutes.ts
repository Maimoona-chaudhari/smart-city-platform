import { Router } from "express";
import { register, login, getOfficers,createOfficer} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";
import User from "../models/User";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get(
  "/officers",
  protect,
  authorize("SUPER_ADMIN"),
  
  getOfficers
);
router.post(
  "/officers",
  protect,
  authorize("SUPER_ADMIN"),
  createOfficer
);
router.get("/profile", protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json({
      message: "You are authorized ✅",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;