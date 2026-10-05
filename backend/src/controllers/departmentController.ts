import { Request, Response } from "express";
import Department from "../models/Department";

export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, code, description } = req.body;

    const department = await Department.create({
      name,
      code,
      description,
    });

    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create department",
    });
  }
};

export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const departments = await Department.find();

  res.json({
    departments,
  });
};