import { Response } from "express";
import Emergency from "../models/Emergency";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { addNotificationJob } from "../queues/notificationQueue";

const isValidId = (id: string): boolean => /^[a-f\d]{24}$/i.test(id);

const populateEmergency = [
  { path: "reportedBy", select: "name email role" },
  { path: "department", select: "name code" },
  { path: "assignedOfficer", select: "name email" },
];

// Allowed next status for an officer
const nextStatusMap: Record<string, string[]> = {
  DISPATCHED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
};

// Notifications must never make the main request fail
const notify = async (
  userIds: (string | undefined)[],
  title: string,
  message: string,
  type: string
): Promise<void> => {
  try {
    const uniqueIds = Array.from(
      new Set(userIds.filter(Boolean) as string[])
    );

    await Promise.all(
      uniqueIds.map((user) =>
        addNotificationJob({ user, title, message, type })
      )
    );
  } catch (error) {
    console.error("EMERGENCY NOTIFICATION ERROR:", error);
  }
};

const notifyAdmins = async (
  excludeUserId: string | undefined,
  title: string,
  message: string,
  type: string
): Promise<void> => {
  try {
    const admins = await User.find({ role: "SUPER_ADMIN" }).select("_id");

    await notify(
      admins
        .map((admin) => admin._id.toString())
        .filter((id) => id !== excludeUserId),
      title,
      message,
      type
    );
  } catch (error) {
    console.error("EMERGENCY ADMIN NOTIFICATION ERROR:", error);
  }
};

export const createEmergency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Only these fields are accepted from the user
    const { title, description, type, priority, location } = req.body;

    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);

    if (
      !title ||
      !description ||
      !type ||
      location?.latitude === undefined ||
      location?.longitude === undefined ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      res.status(400).json({
        message: "Title, description, type and location are required",
      });
      return;
    }

    if (priority && !["HIGH", "CRITICAL"].includes(priority)) {
      res.status(400).json({
        message: "Priority must be HIGH or CRITICAL",
      });
      return;
    }

    const emergency = await Emergency.create({
      title,
      description,
      type,
      priority: priority || "HIGH",
      location: { latitude, longitude },
      reportedBy: req.user?.userId,
    });

    await notifyAdmins(
      req.user?.userId,
      emergency.priority === "CRITICAL"
        ? "Critical Emergency Reported"
        : "New Emergency Reported",
      `"${emergency.title}" (${emergency.type}) has been reported.`,
      "EMERGENCY_REPORTED"
    );

    res.status(201).json({
      message: "Emergency reported successfully",
      emergency,
    });
  } catch (error) {
    console.error("CREATE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Failed to report emergency",
    });
  }
};

export const getEmergencies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const departmentId = req.user?.departmentId;

    let filter: Record<string, unknown> = {};

    if (role === "CITIZEN") {
      filter = { reportedBy: userId };
    } else if (role === "OFFICER") {
      filter = departmentId
        ? { $or: [{ assignedOfficer: userId }, { department: departmentId }] }
        : { assignedOfficer: userId };
    } else if (role !== "SUPER_ADMIN") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const emergencies = await Emergency.find(filter)
      .populate(populateEmergency)
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    console.error("GET EMERGENCIES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch emergencies",
    });
  }
};

// Admin dispatches an emergency to an officer
export const assignEmergency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const officerId = String(req.body.officerId || "");

    if (!isValidId(id) || !isValidId(officerId)) {
      res.status(400).json({ message: "Invalid emergency or officer ID" });
      return;
    }

    const emergency = await Emergency.findById(id);

    if (!emergency) {
      res.status(404).json({ message: "Emergency not found" });
      return;
    }

    if (!["REPORTED", "DISPATCHED"].includes(emergency.status)) {
      res.status(400).json({
        message: "Only REPORTED or DISPATCHED emergencies can be assigned",
      });
      return;
    }

    const officer = await User.findById(officerId);

    if (!officer || officer.role !== "OFFICER") {
      res.status(400).json({ message: "Selected user is not an officer" });
      return;
    }

    emergency.assignedOfficer = officer._id as any;
    emergency.department = (officer as any).department;
    emergency.status = "DISPATCHED";
    emergency.dispatchedAt = new Date();

    await emergency.save();

    await Promise.all([
      notify(
        [officer._id.toString()],
        "Emergency Assigned",
        `You have been assigned emergency "${emergency.title}".`,
        "EMERGENCY_ASSIGNED"
      ),
      notify(
        [emergency.reportedBy.toString()],
        "Emergency Dispatched",
        `Help has been dispatched for your emergency "${emergency.title}".`,
        "EMERGENCY_STATUS"
      ),
    ]);

    await emergency.populate(populateEmergency);

    res.json({
      message: "Emergency dispatched successfully",
      emergency,
    });
  } catch (error) {
    console.error("ASSIGN EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Failed to assign emergency",
    });
  }
};

// Only the assigned officer can move the status forward
export const updateEmergencyStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!isValidId(id)) {
      res.status(400).json({ message: "Invalid emergency ID" });
      return;
    }

    if (!["IN_PROGRESS", "RESOLVED"].includes(status)) {
      res.status(400).json({
        message: "Status must be IN_PROGRESS or RESOLVED",
      });
      return;
    }

    const emergency = await Emergency.findById(id);

    if (!emergency) {
      res.status(404).json({ message: "Emergency not found" });
      return;
    }

    if (emergency.assignedOfficer?.toString() !== req.user?.userId) {
      res.status(403).json({
        message: "Only the assigned officer can update this emergency",
      });
      return;
    }

    const allowedNext = nextStatusMap[emergency.status] || [];

    if (!allowedNext.includes(status)) {
      res.status(400).json({
        message: `Cannot change status from ${emergency.status} to ${status}`,
      });
      return;
    }

    emergency.status = status;

    if (status === "RESOLVED") {
      emergency.resolvedAt = new Date();
    }

    await emergency.save();

    await notify(
      [emergency.reportedBy.toString()],
      "Emergency Status Updated",
      `Your emergency "${emergency.title}" is now ${status.replace("_", " ")}.`,
      "EMERGENCY_STATUS"
    );

    await emergency.populate(populateEmergency);

    res.json({
      message: "Emergency status updated successfully",
      emergency,
    });
  } catch (error) {
    console.error("UPDATE EMERGENCY STATUS ERROR:", error);

    res.status(500).json({
      message: "Failed to update emergency status",
    });
  }
};