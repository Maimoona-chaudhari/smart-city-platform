import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export const authorize = (...allowedRoles: string[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "Access denied",
      });
      return;
    }

    next();
  };
};