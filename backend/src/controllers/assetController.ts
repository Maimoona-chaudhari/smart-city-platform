import { Response } from "express";
import Asset from "../models/Asset";
import { AuthRequest } from "../middleware/authMiddleware";

export const createAsset = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role === "OFFICER") {
      req.body.department = req.user.departmentId;
    } else if (req.user?.role === "SUPER_ADMIN" && !req.body.department) {
      res.status(400).json({ message: "Department is required" });
      return;
    }

    const asset = await Asset.create(req.body);

    res.status(201).json({
      message: "Asset created successfully",
      asset,
    });
  } catch (error) {
    console.error("CREATE ASSET ERROR:", error);
    res.status(500).json({
      message: "Failed to create asset",
    });
  }
};

export const getAssets = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const filter: any = {};

    // Officers can only see assets of their department
    if (req.user?.role === "OFFICER") {
      filter.department = req.user.departmentId;
    }

    const assets = await Asset.find(filter)
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assets",
    });
  }
};

export const updateAssetStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!asset) {
      res.status(404).json({
        message: "Asset not found",
      });
      return;
    }

    res.json({
      message: "Asset status updated successfully",
      asset,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update asset status",
    });
  }
};