import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "../services/AuthService";
import { User } from "../models/User";

function validationErrors(req: Request) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return result.array({ onlyFirstError: true });
  }
  return null;
}

function isDuplicateKey(err: any) {
  return err && (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000));
}

function duplicateKeyMessage(err: any) {
  const key = Object.keys(err?.keyPattern || err?.keyValue || {})[0] || "field";
  return `${key} already exists`;
}

const sanitizeUser = (u: any) => {
  if (!u) return null;
  const src = (typeof u?.toObject === "function" ? u.toObject() : u) as any;
  const { password, __v, resetToken, resetTokenExpires, ...rest } = src;
  return rest;
};

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class AuthController {

  // ✅ Helper to extract user ID from JWT token
  private static getUserId(req: Request): string | null {
    const userId = (req.user as any)?.userId?.toString()
      || (req.user as any)?._id?.toString()
      || (req.user as any)?.sub?.toString()
      || (req.user as any)?.id?.toString();

    return userId || null;
  }

  static async register(req: Request, res: Response, _next: NextFunction) {
    try {
      const errors = validationErrors(req);
      if (errors) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          details: errors,
        });
      }

      const userData = {
        fullName: req.body.fullName,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        role: req.body.role,
        collegeName: req.body.collegeName,
        department: req.body.department,
        semester: req.body.semester,
      };

      const result = await AuthService.register(userData);

      return res.status(201).json({
        success: true,
        message: "Registered successfully",
        ...result,
      });
    } catch (error: any) {
      if (isDuplicateKey(error)) {
        return res.status(409).json({
          success: false,
          error: duplicateKeyMessage(error),
        });
      }
      return res.status(400).json({
        success: false,
        error: error?.message || "Registration failed",
      });
    }
  }

  static async login(req: Request, res: Response, _next: NextFunction) {
    try {
      const errors = validationErrors(req);
      if (errors) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          details: errors,
        });
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        ...result,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: error?.message || "Invalid credentials",
      });
    }
  }

  static async getProfile(req: Request, res: Response, _next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const maybeId = AuthController.getUserId(req);

      if (!maybeId) {
        return res.status(400).json({ success: false, error: "Invalid user ID" });
      }

      // ✅ Populate with correct field name: clubName
      const userObj = await User.findById(maybeId)
        .select("-password -__v")
        .populate({
          path: 'clubRepresentative.clubId',
          select: 'clubName description logo clubtype' // ✅ Use clubName, not name
        })
        .lean();

      if (!userObj) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      return res.status(200).json({
        success: true,
        user: sanitizeUser(userObj)
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to fetch profile",
      });
    }
  }



  // ✅ FIXED: Update profile
  static async updateProfile(req: Request, res: Response, _next: NextFunction) {
    try {
      const userId = AuthController.getUserId(req);

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      console.log('✅ Updating profile for user:', userId);

      const { fullName, collegeName, department, semester, profilePicture, bio, phone } = req.body;

      const updateData: any = {
        ...(fullName !== undefined && { fullName }),
        ...(collegeName !== undefined && { collegeName }),
        ...(department !== undefined && { department }),
        ...(semester !== undefined && { semester }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
      };

      const result = await AuthService.updateProfile(userId, updateData);

      return res.status(200).json({
        success: true,
        message: "Profile updated",
        ...result,
      });
    } catch (error: any) {
      console.error('❌ Update profile error:', error.message);
      if (isDuplicateKey(error)) {
        return res.status(409).json({
          success: false,
          error: duplicateKeyMessage(error),
        });
      }
      return res.status(400).json({
        success: false,
        error: error?.message || "Update failed",
      });
    }
  }

  // ✅ FIXED: Change password
  static async changePassword(req: Request, res: Response, _next: NextFunction) {
    try {
      const errors = validationErrors(req);
      if (errors) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          details: errors,
        });
      }

      const userId = AuthController.getUserId(req);

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error?.message || "Password change failed",
      });
    }
  }

  static async refreshToken(req: Request, res: Response, _next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: "Refresh token is required" });
      }

      const result = await AuthService.refreshToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: "Token refreshed",
        ...result,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: error?.message || "Invalid refresh token",
      });
    }
  }

  static async logout(_req: Request, res: Response, _next: NextFunction) {
    try {
      return res.status(200).json({
        success: true,
        message: "Logged out successfully. Please delete tokens from client storage.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || "Logout failed",
      });
    }
  }
}
