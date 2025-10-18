import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { ClubRepresentativeService } from '../services/ClubRepresentativeService';
import { IUser } from '../models/interfaces/IUser';

export class AdminController {

  // ✅ Helper to extract admin ID from JWT token
  private static getAdminId(req: Request): string {
    const userId = (req.user as any)?.userId?.toString() 
                || (req.user as any)?._id?.toString() 
                || (req.user as any)?.sub?.toString();
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    
    return userId;
  }

  // Club Representative Management
  static async getPendingRepresentatives(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      console.log('✅ Getting pending representatives for admin:', adminId);
      
      const result = await AdminService.getPendingRepresentativeRequests(adminId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ getPendingRepresentatives error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async processRepresentativeRequest(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const { membershipId } = req.params;
      const { decision, adminNotes, reviewMethod } = req.body;

      console.log('✅ Processing request:', { adminId, membershipId, decision });

      if (!['approved', 'rejected'].includes(decision)) {
        res.status(400).json({
          success: false,
          message: 'Decision must be either approved or rejected'
        });
        return;
      }

      const result = await AdminService.processRepresentativeRequest(
        adminId,
        membershipId,
        decision,
        adminNotes
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ processRepresentativeRequest error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRepresentativeHistory(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log('✅ Getting representative history for admin:', adminId);
      
      const result = await AdminService.getRepresentativeHistory(adminId, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ getRepresentativeHistory error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getApplicationDetails(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const { applicationId } = req.params;

      const result = await ClubRepresentativeService.getApplicationDetails(adminId, applicationId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ getApplicationDetails error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Club Membership Management
  static async getPendingMemberships(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const result = await AdminService.getPendingClubMemberships(adminId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ getPendingMemberships error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async approveMembership(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const { membershipId } = req.params;
      const { decision, notes } = req.body;

      if (!['approved', 'rejected'].includes(decision)) {
        res.status(400).json({
          success: false,
          message: 'Decision must be either approved or rejected'
        });
        return;
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
      console.error('❌ approveMembership error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // User Management
  static async promoteToAdmin(req: Request, res: Response): Promise<void> {
    try {
      const promoterId = AdminController.getAdminId(req);
      const { targetUserId, adminLevel, permissions } = req.body;

      if (!targetUserId || !adminLevel || !permissions) {
        res.status(400).json({
          success: false,
          message: 'targetUserId, adminLevel, and permissions are required'
        });
        return;
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
      console.error('❌ promoteToAdmin error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async grantPermissions(req: Request, res: Response): Promise<void> {
    try {
      const adminId = AdminController.getAdminId(req);
      const { targetUserId, permissions } = req.body;

      if (!targetUserId || !permissions || !Array.isArray(permissions)) {
        res.status(400).json({
          success: false,
          message: 'targetUserId and permissions array are required'
        });
        return;
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
      console.error('❌ grantPermissions error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
