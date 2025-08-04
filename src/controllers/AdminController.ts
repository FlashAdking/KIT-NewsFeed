import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { ClubRepresentativeService } from '../services/ClubRepresentativeService'; // ✅ ADD THIS IMPORT
import { IUser } from '../models/interfaces/IUser';

export class AdminController {

  // Faculty Management
  static async getPendingFaculty(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const result = await AdminService.getPendingFacultyApprovals(adminId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async processFacultyApproval(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const { facultyId } = req.params;
      const { decision, notes } = req.body;

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Decision must be either approved or rejected'
        });
      }

      const result = await AdminService.processFacultyApproval(
        adminId,
        facultyId,
        decision,
        notes
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getFacultyHistory(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminService.getFacultyApprovalHistory(adminId, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Club Representative Management
  static async getPendingRepresentatives(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const result = await AdminService.getPendingRepresentativeRequests(adminId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ FIXED: Single enhanced representative request processing
  static async processRepresentativeRequest(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const { membershipId } = req.params;
      const { decision, adminNotes, reviewMethod } = req.body;

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Decision must be either approved or rejected'
        });
      }

      // ✅ Use ClubRepresentativeService for enhanced processing
      const result = await ClubRepresentativeService.processRepresentativeRequest(
        adminId,
        membershipId,
        decision,
        adminNotes,
        reviewMethod
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRepresentativeHistory(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminService.getRepresentativeHistory(adminId, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ NEW: Get detailed application for admin review
  static async getApplicationDetails(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const { applicationId } = req.params;

      const result = await ClubRepresentativeService.getApplicationDetails(adminId, applicationId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Club Membership Management
  static async getPendingMemberships(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const result = await AdminService.getPendingClubMemberships(adminId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async approveMembership(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const { membershipId } = req.params;
      const { decision, notes } = req.body;

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Decision must be either approved or rejected'
        });
      }

      const result = await AdminService.approveClubMembership(
        adminId,
        membershipId,
        decision,
        notes
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // User Management
  static async promoteToAdmin(req: Request, res: Response) {
    try {
      const promoterId = (req.user as IUser)._id.toString();
      const { targetUserId, adminLevel, permissions } = req.body;

      if (!targetUserId || !adminLevel || !permissions) {
        return res.status(400).json({
          success: false,
          message: 'targetUserId, adminLevel, and permissions are required'
        });
      }

      const result = await AdminService.promoteToAdmin(
        promoterId,
        targetUserId,
        adminLevel,
        permissions
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async grantPermissions(req: Request, res: Response) {
    try {
      const adminId = (req.user as IUser)._id.toString();
      const { targetUserId, permissions } = req.body;

      if (!targetUserId || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'targetUserId and permissions array are required'
        });
      }

      const result = await AdminService.grantPermissions(
        adminId,
        targetUserId,
        permissions
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
