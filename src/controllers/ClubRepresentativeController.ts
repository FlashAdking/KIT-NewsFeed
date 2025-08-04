import { Request, Response } from 'express';
import { ClubRepresentativeService } from '../services/ClubRepresentativeService';

export class ClubRepresentativeController {
  /* ------------------------------------------------------------------ *
   * POST /api/club-representative/apply                                *
   * ------------------------------------------------------------------ */
  static async apply(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();

      // All field-level validation is handled by repApplicationValidators.
      const result = await ClubRepresentativeService.apply(studentId, req.body);

      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /* ------------------------------------------------------------------ *
   * Legacy simple-request endpoint                                     *
   * ------------------------------------------------------------------ */
  static async requestRepresentation(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
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
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /* ------------------------------------------------------------------ *
   * Student dashboards                                                 *
   * ------------------------------------------------------------------ */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
      const result = await ClubRepresentativeService.getStudentApplications(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getAvailableClubs(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
      const result = await ClubRepresentativeService.getAvailableClubs(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
      const { membershipId } = req.params;
      const result = await ClubRepresentativeService.cancelRepresentativeRequest(
        studentId,
        membershipId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getClubDetails(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
      const result = await ClubRepresentativeService.getClubDetails(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
      const result = await ClubRepresentativeService.canRequestRepresentation(studentId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /* ------------------------------------------------------------------ *
   * GET /api/club-representative/applications/:applicationId           *
   * ------------------------------------------------------------------ */
  static async getApplicationDetails(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user._id.toString();
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
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
