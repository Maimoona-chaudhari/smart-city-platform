import { Response } from "express";
import Asset from "../models/Asset";
import Complaint from "../models/Complaint";
import Emergency from "../models/Emergency";
import { AuthRequest } from "../middleware/authMiddleware";

export const getMapData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [assets, complaints, emergencies] = await Promise.all([
      Asset.find()
        .select("name type status location department")
        .populate("department", "name"),

      Complaint.find()
        .select(
          "title category priority status location department assignedOfficer"
        )
        .populate("department", "name")
        .populate("assignedOfficer", "name"),

      Emergency.find()
        .select("title type priority status location"),
    ]);

    res.json({
      assets,
      complaints,
      emergencies,
    });
  } catch (error) {
    console.error("GIS MAP DATA ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch map data",
    });
  }
};