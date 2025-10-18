import { Request, Response } from 'express';
import { ClubRepresentativeService } from '../services/ClubRepresentativeService';

export class ClubRepresentativeController {
  // ✅ Helper function to get user ID from token (NO this. in static context)
  private static getUserId(req: Request): string {
    return req.user?.userId?.toString() || req.user?.sub || req.user?._id?.toString();
  }

  static async apply(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      console.log('✅ Apply - Student ID:', studentId);

      const result = await ClubRepresentativeService.apply(studentId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ Apply error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async requestRepresentation(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      const { clubId, notes } = req.body;

      if (!clubId) {
        res.status(400).json({ success: false, message: 'clubId is required' });
        return;
      }

      const result = await ClubRepresentativeService.requestClubRepresentation(
        studentId,
        clubId,
        notes
      );

      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ requestRepresentation error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      console.log('✅ getStatus - Student ID:', studentId);
      
      const result = await ClubRepresentativeService.getStudentApplications(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ getStatus error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getAvailableClubs(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      console.log('✅ getAvailableClubs - Student ID:', studentId);
      
      const result = await ClubRepresentativeService.getAvailableClubs(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ getAvailableClubs error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      const { membershipId } = req.params;
      
      const result = await ClubRepresentativeService.cancelRepresentativeRequest(
        studentId,
        membershipId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ cancelRequest error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getClubDetails(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      const result = await ClubRepresentativeService.getClubDetails(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ getClubDetails error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      console.log('✅ checkEligibility - Student ID:', studentId);
      
      const result = await ClubRepresentativeService.canRequestRepresentation(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ checkEligibility error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getApplicationDetails(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      const { applicationId } = req.params;

      const { ClubMembership } = await import('../models/ClubMembership');
      const application = await ClubMembership.findOne({
        _id: applicationId,
        userId: studentId
      })
        .populate('clubId', 'clubName clubtype department')
        .populate('decidedBy', 'fullName email');

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      res.status(200).json({ success: true, data: { application } });
    } catch (err: any) {
      console.error('❌ getApplicationDetails error:', err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
