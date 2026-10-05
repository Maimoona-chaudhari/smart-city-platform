import { Response } from "express";
import Workflow from "../models/Workflow";
import { AuthRequest } from "../middleware/authMiddleware";

export const createWorkflow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      department,
      steps,
    } = req.body;

    if (
      !name ||
      !steps ||
      !Array.isArray(steps) ||
      steps.length === 0
    ) {
      res.status(400).json({
        message:
          "Name and at least one workflow step are required",
      });
      return;
    }

    const workflow = await Workflow.create({
      name,
      description,
      department: department || undefined,
      steps,
    });

    const populatedWorkflow =
      await Workflow.findById(workflow._id).populate(
        "department",
        "name code"
      );

    res.status(201).json({
      message: "Workflow created successfully",
      workflow: populatedWorkflow,
    });
  } catch (error) {
    console.error("CREATE WORKFLOW ERROR:", error);

    res.status(500).json({
      message: "Failed to create workflow",
    });
  }
};

export const getWorkflows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workflows = await Workflow.find()
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    res.json({
      workflows,
    });
  } catch (error) {
    console.error("GET WORKFLOWS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch workflows",
    });
  }
};

export const getWorkflowById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workflow = await Workflow.findById(
      req.params.id
    ).populate("department", "name code");

    if (!workflow) {
      res.status(404).json({
        message: "Workflow not found",
      });
      return;
    }

    res.json({
      workflow,
    });
  } catch (error) {
    console.error("GET WORKFLOW ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch workflow",
    });
  }
};

export const deleteWorkflow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workflow = await Workflow.findByIdAndDelete(
      req.params.id
    );

    if (!workflow) {
      res.status(404).json({
        message: "Workflow not found",
      });
      return;
    }

    res.json({
      message: "Workflow deleted successfully",
    });
  } catch (error) {
    console.error("DELETE WORKFLOW ERROR:", error);

    res.status(500).json({
      message: "Failed to delete workflow",
    });
  }
};