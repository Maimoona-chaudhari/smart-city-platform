import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        message: "Name, email and password are required",
      });
      return;
    }
        if (String(password).length < 6) {
      res.status(400).json({
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "CITIZEN",
    });

    res.status(201).json({
      message: "Citizen registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        departmentId: user.department?.toString(),
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getOfficers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const officers = await User.find({ role: "OFFICER" })
      .select("_id name email department")
      .populate("department", "name");

    res.json({
      officers,
    });
  } catch (error) {
    console.error("GET OFFICERS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch officers",
    });
  }
};

export const createOfficer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      res.status(400).json({
        message: "Name, email, password and department are required",
      });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const officer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "OFFICER",
      department,
    });

    const officerResponse = await User.findById(officer._id)
      .select("-password")
      .populate("department", "name");

    res.status(201).json({
      message: "Officer created successfully",
      officer: officerResponse,
    });
  } catch (error) {
    console.error("CREATE OFFICER ERROR:", error);

    res.status(500).json({
      message: "Failed to create officer",
    });
  }
};