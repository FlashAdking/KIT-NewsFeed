import { Request, Response } from 'express';
import { ClubRepresentativeService } from '../services/ClubRepresentativeService';
import { ClubMembership, IClubMembership } from '../models/ClubMembership';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User';

export class ClubRepresentativeController {
  private static getUserId(req: Request): string {
    return req.user?.userId?.toString() || req.user?.sub || req.user?._id?.toString();
  }

  static async apply(req: Request, res: Response): Promise<void> {
    try {
      const studentId = ClubRepresentativeController.getUserId(req);
      const file = (req as any).file;

      console.log('✅ Apply - Student ID:', studentId);
      console.log('✅ Apply - File:', file?.filename);

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Verification document is required'
        });
        return;
      }

      const payload = {
        ...req.body,
        verificationDocument: {
          filename: file.filename,
          path: file.path,
          fileType: file.mimetype,
          fileSize: file.size
        }
      };

      const result = await ClubRepresentativeService.apply(studentId, payload);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      console.error('❌ Apply error:', err.message);

      const uploadedFile = (req as any).file;
      if (uploadedFile && fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }

      res.status(400).json({ success: false, message: err.message });
    }
  }


  // In ClubRepresentativeController.ts
  static async serveDocument(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const userId = ClubRepresentativeController.getUserId(req);

      // ✅ Changed variable name from 'user' to 'currentUser' to avoid conflict
      const currentUser = await User.findById(userId);

      if (currentUser?.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const filePath = path.join(__dirname, '../../uploads/verifications', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (err: any) {
      console.error('❌ Serve document error:', err.message);
      res.status(500).json({ success: false, message: err.message });
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

      // ✅ No need for dynamic import anymore
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
