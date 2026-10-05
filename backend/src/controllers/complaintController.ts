import { Response } from "express";
import { UploadApiResponse } from "cloudinary";
import Complaint from "../models/Complaint";
import { AuthRequest } from "../middleware/authMiddleware";
import Department from "../models/Department";
import { getDepartmentName } from "../services/complaintRoutingService";
import { addNotificationJob } from "../queues/notificationQueue";
import Workflow from "../models/Workflow";
import cloudinary from "../config/cloudinary";
import User from "../models/User";
// Uploads an image buffer (from multer memoryStorage) to Cloudinary
const uploadToCloudinary = (
  buffer: Buffer
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-city/complaints",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

export const createComplaint = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      priority,
      department,
      location,
    } = req.body;

    // With FormData, location arrives as a JSON string.
    // With plain JSON requests it is already an object.
    let parsedLocation = location;

    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        res.status(400).json({
          message: "Invalid location format",
        });
        return;
      }
    }

    if (
      !title ||
      !description ||
      !category ||
      !parsedLocation?.latitude ||
      !parsedLocation?.longitude
    ) {
      res.status(400).json({
        message:
          "Title, description, category and location are required",
      });
      return;
    }

    const slaHours =
      priority === "CRITICAL"
        ? 4
        : priority === "HIGH"
        ? 24
        : priority === "MEDIUM"
        ? 48
        : 72;

    const slaDeadline = new Date(
      Date.now() + slaHours * 60 * 60 * 1000
    );

    const departmentName = getDepartmentName(category);

    let departmentId;

    if (departmentName) {
      const department = await Department.findOne({
        name: departmentName,
      });

      departmentId = department?._id;
    }

    // Find an active workflow for this department.
    // If no department-specific workflow exists,
    // use a general workflow.
    const workflow = await Workflow.findOne({
      isActive: true,
      $or: [
        { department: departmentId },
        { department: { $exists: false } },
        { department: null },
      ],
    }).sort({
      department: -1,
    });

    // Evidence image is optional
    const attachments = [];

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer);

      attachments.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        name: req.file.originalname,
        type: req.file.mimetype,
      });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      department: departmentId,
      citizen: req.user?.userId,

      // Workflow starts from Step 1
      workflow: workflow?._id,
      currentWorkflowStep: 1,

      slaDeadline,
      location: parsedLocation,
      attachments,
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("CREATE COMPLAINT ERROR:", error);

    res.status(500).json({
      message: "Failed to create complaint",
    });
  }
};
export const getMyComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const complaints = await Complaint.find({
      citizen: req.user?.userId,
    })
      .populate("department", "name code")
      .populate("workflow", "name description steps")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET MY COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to get complaints",
    });
  }
};

export const getComplaintById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!/^[a-f\d]{24}$/i.test(id)) {
      res.status(400).json({ message: "Invalid complaint ID" });
      return;
    }

    const complaint = await Complaint.findById(id)
      .populate("citizen", "name email")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .populate("workflow", "name description steps");

    if (!complaint) {
      res.status(404).json({ message: "Complaint not found" });
      return;
    }

    const userId = req.user?.userId;
    const role = req.user?.role;
    const departmentId = req.user?.departmentId;

    const isCitizenOwner = complaint.citizen._id.toString() === userId;
    const isAssignedOfficer =
      complaint.assignedOfficer?._id?.toString() === userId;
    const isSameDepartment =
      complaint.department?._id?.toString() === departmentId;

    if (
      (role === "CITIZEN" && !isCitizenOwner) ||
      (role === "OFFICER" && !isAssignedOfficer && !isSameDepartment) ||
      !["CITIZEN", "OFFICER", "SUPER_ADMIN"].includes(role || "")
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json({ complaint });
  } catch (error) {
    console.error("GET COMPLAINT BY ID ERROR:", error);
    res.status(500).json({ message: "Failed to get complaint" });
  }
};

export const assignComplaint = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
       const id = String(req.params.id);
    const officerId = String(req.body.officerId || "");

    if (!/^[a-f\d]{24}$/i.test(id) || !/^[a-f\d]{24}$/i.test(officerId)) {
      res.status(400).json({ message: "Invalid complaint or officer ID" });
      return;
    }

    const officer = await User.findOne({ _id: officerId, role: "OFFICER" });

    if (!officer) {
      res.status(400).json({ message: "Selected user is not an officer" });
      return;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        assignedOfficer: officerId,
        status: "ASSIGNED",

        // ASSIGNED = Workflow Step 3
        currentWorkflowStep: 3,
      },
      { new: true }
    )
      .populate("assignedOfficer", "name email")
      .populate("department", "name code")
      .populate("workflow", "name description steps");

    if (!complaint) {
      res.status(404).json({
        message: "Complaint not found",
      });
      return;
    }

    await Promise.all([
      addNotificationJob({
        user: complaint.citizen.toString(),
        title: "Complaint Assigned",
        message: `Your complaint "${complaint.title}" has been assigned to an officer.`,
        type: "COMPLAINT_STATUS",
      }),
      addNotificationJob({
        user: officerId,
        title: "New Complaint Assigned",
        message: `You have been assigned complaint "${complaint.title}".`,
        type: "COMPLAINT_ASSIGNED",
      }),
    ]);

    res.json({
      message: "Complaint assigned successfully",
      complaint,
    });
  } catch (error) {
    console.error("ASSIGN COMPLAINT ERROR:", error);

    res.status(500).json({
      message: "Failed to assign complaint",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAssignedComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const complaints = await Complaint.find({
      assignedOfficer: req.user?.userId,
    })
      .populate("citizen", "name email")
      .populate("department", "name code")
      .populate("workflow", "name description steps");

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET ASSIGNED COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to get assigned complaints",
    });
  }
};

export const getDepartmentComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const complaints = await Complaint.find({
      department: req.user?.departmentId,
    })
      .populate("citizen", "name email")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .populate("workflow", "name description steps");

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET DEPARTMENT COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to get department complaints",
    });
  }
};

export const updateComplaintStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "SUBMITTED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid status",
      });
      return;
    }

    // Connect complaint status with workflow step
    const workflowStepMap: Record<string, number> = {
      SUBMITTED: 1,
      ASSIGNED: 3,
      IN_PROGRESS: 4,
      RESOLVED: 5,
      CLOSED: 6,
    };

    const workflowStep = workflowStepMap[status];

        const id = String(req.params.id);

    if (!/^[a-f\d]{24}$/i.test(id)) {
      res.status(400).json({ message: "Invalid complaint ID" });
      return;
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      res.status(404).json({
        message: "Complaint not found",
      });
      return;
    }

    // Officers can only update complaints assigned to them
    if (
      req.user?.role === "OFFICER" &&
      complaint.assignedOfficer?.toString() !== req.user.userId
    ) {
      res.status(403).json({
        message: "Only the assigned officer can update this complaint",
      });
      return;
    }

    complaint.status = status;
    complaint.currentWorkflowStep = workflowStep;

    // Record the first time the complaint is resolved
    if (status === "RESOLVED" && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    await complaint.populate("workflow", "name description steps");
    await complaint.populate("department", "name code");
    await complaint.populate("assignedOfficer", "name email");
    await complaint.populate("citizen", "name email");

    await addNotificationJob({
      user: complaint.citizen._id
        ? complaint.citizen._id.toString()
        : complaint.citizen.toString(),
      title: "Complaint Status Updated",
      message: `Your complaint "${complaint.title}" is now ${status}.`,
      type: "COMPLAINT_STATUS",
    });

    res.json({
      message: "Complaint status updated successfully",
      complaint,
    });
  } catch (error) {
    console.error("UPDATE COMPLAINT STATUS ERROR:", error);

    res.status(500).json({
      message: "Failed to update complaint status",
    });
  }
};

export const getAllComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const complaints = await Complaint.find()
      .populate("citizen", "name email")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .populate("workflow", "name description steps")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error("GET ALL COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch complaints",
    });
  }
};