import { Types } from 'mongoose';
import { User } from '../models/User';
import { Club } from '../models/Club';
import { ClubMembership } from '../models/ClubMembership';

export class ClubRepresentativeService {
  /* ------------------------------------------------------------------
   * Private helpers
   * -----------------------------------------------------------------*/

  private static async studentHasActiveOrPendingRep(userId: string): Promise<boolean> {
    return !!(await ClubMembership.findOne({
      userId: new Types.ObjectId(userId),
      role: 'representative',
      status: { $in: ['pending', 'approved'] }
    }).lean());
  }

  private static async approvedRepCount(clubId: string): Promise<number> {
    return await ClubMembership.countDocuments({
      clubId: new Types.ObjectId(clubId),
      role: 'representative',
      status: 'approved'
    });
  }

  private static async positionTaken(clubId: string, position: string): Promise<boolean> {
    return !!(await ClubMembership.findOne({
      clubId: new Types.ObjectId(clubId),
      role: 'representative',
      status: { $in: ['pending', 'approved'] },
      clubPosition: position
    }).lean());
  }

  /* ------------------------------------------------------------------
   * Main application method - UPDATED to support new clubs
   * -----------------------------------------------------------------*/
  static async apply(
    studentId: string,
    payload: {
      /* ➊ Existing club path */
      clubId?: string;

      /* ➋ New club registration path */
      clubName?: string;
      clubType?: 'academic' | 'cultural' | 'sports' | 'technical' | 'social';
      department?: string;

      /* Shared fields */
      clubPosition: 'president' | 'vice-president' | 'secretary' | 'coordinator' | 'treasurer';
      officialEmail: string;
      officialPhone: string;
      statement: string;
      supportingDocUrl?: string;
    }
  ) {
    console.log('🔍 ClubRepresentativeService.apply() called with:', { 
      hasClubId: !!payload.clubId, 
      hasClubName: !!payload.clubName 
    });

    /* ---------- 1. user check ---------- */
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student')
      throw new Error('Only students can apply for club representation');

    /* ---------- 2. one-club-per-student check ---------- */
    if (await this.studentHasActiveOrPendingRep(studentId))
      throw new Error('You already represent a club or have a pending request');

    let clubId: Types.ObjectId;
    let newClubCreated = false;

    /* ---------- 3A. Existing-club path ---------- */
    if (payload.clubId) {
      console.log('📋 Taking existing-club path');
      
      const club = await Club.findById(payload.clubId);
      if (!club || !club.isActive)
        throw new Error('Club not found or inactive');

      /* 3-rep limit */
      if ((await this.approvedRepCount(club._id.toString())) >= 3)
        throw new Error('This club already has the maximum of 3 representatives');

      /* duplicate position check */
      if (await this.positionTaken(club._id.toString(), payload.clubPosition))
        throw new Error(`The position "${payload.clubPosition}" is already taken`);

      clubId = club._id;
    }

    /* ---------- 3B. New-club path ---------- */
    else {
      console.log('🆕 Taking new-club creation path');
      
      if (!payload.clubName || !payload.clubType)
        throw new Error('clubName and clubType are required for new clubs');

      const club = new Club({
        clubName: payload.clubName,
        clubtype: payload.clubType,
        description: `${payload.clubName} – created via rep application`,
        collegeName: student.collegeName,
        department: payload.department || student.department,
        isActive: true,
        isApproved: false,          // admin will approve during request processing
        createdBy: student._id
      });

      await club.save();
      clubId = club._id;
      newClubCreated = true;
      
      console.log(`✅ New club created: ${club.clubName} (${clubId})`);
    }

    /* ---------- 4. Create membership request ---------- */
    const application = new ClubMembership({
      userId: student._id,
      clubId,
      role: 'representative',
      status: 'pending',
      clubPosition: payload.clubPosition,
      officialEmail: payload.officialEmail,
      officialPhone: payload.officialPhone,

      applicationDetails: {
        fullName: student.fullName,
        email: student.email,
        department: student.department,
        semester: student.semester || 1,
        clubPosition: payload.clubPosition,
        officialEmail: payload.officialEmail,
        officialPhone: payload.officialPhone,
        statement: payload.statement,
        supportingDocUrl: payload.supportingDocUrl
      },

      requestedAt: new Date()
    });

    await application.save();

    return {
      message: 'Club representative application submitted successfully',
      applicationId: application._id,
      clubId,
      position: payload.clubPosition,
      newClubCreated,
      status: 'pending_review'
    };
  }

  /* ------------------------------------------------------------------
   * Admin workflow methods - UPDATED to handle new clubs
   * -----------------------------------------------------------------*/
  static async processRepresentativeRequest(
    adminId: string,
    membershipId: string,
    decision: 'approved' | 'rejected',
    adminNotes?: string,
    reviewMethod?: 'email' | 'phone'
  ) {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const membership = await ClubMembership.findById(membershipId)
      .populate('userId')
      .populate('clubId');

    if (!membership || membership.role !== 'representative') {
      throw new Error('Representative request not found');
    }

    if (membership.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    // Update membership
    membership.status = decision;
    membership.decidedBy = new Types.ObjectId(adminId);
    membership.decidedAt = new Date();
    membership.adminNotes = adminNotes;
    membership.reviewMethod = reviewMethod;

    await membership.save();

    if (decision === 'approved') {
      // Activate user's club representative status
      await User.findByIdAndUpdate(membership.userId, {
        clubRepresentative: {
          isActive: true,
          clubId: membership.clubId,
          clubPosition: membership.clubPosition,
          approvedBy: adminId,
          approvedAt: membership.decidedAt
        }
      });

      // ✅ NEW: If this was a new club application, approve the club too
      const club = await Club.findById(membership.clubId);
      if (club && !club.isApproved) {
        club.isApproved = true;
        await club.save();
        console.log(`✅ Club auto-approved: ${club.clubName}`);
      }

      console.log(`✅ Club representative approved: ${(membership.userId as any)?.fullName}`);
    } else {
      // Record rejection
      await User.findByIdAndUpdate(membership.userId, {
        clubRepresentative: {
          isActive: false,
          clubId: membership.clubId,
          rejectedAt: membership.decidedAt,
          rejectionNotes: adminNotes
        }
      });

      console.log(`❌ Club representative rejected: ${(membership.userId as any)?.fullName}`);
    }

    return {
      message: `Club representative request ${decision} successfully`,
      membershipId: membership._id,
      status: membership.status
    };
  }

  /* ------------------------------------------------------------------
   * All other methods remain the same...
   * -----------------------------------------------------------------*/
  static async getPendingRepresentativeRequests(adminId: string) {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const pendingRequests = await ClubMembership.find({
      role: 'representative',
      status: 'pending'
    })
      .populate('userId', 'fullName email username department semester')
      .populate('clubId', 'clubName clubtype department')
      .sort({ requestedAt: -1 });

    return {
      count: pendingRequests.length,
      requests: pendingRequests.map(request => ({
        _id: request._id,
        student: request.userId,
        club: request.clubId,
        clubPosition: request.clubPosition,
        applicationDetails: request.applicationDetails,
        requestedAt: request.requestedAt,
        officialEmail: request.officialEmail,
        officialPhone: request.officialPhone
      }))
    };
  }

  static async getApplicationDetails(adminId: string, applicationId: string) {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const application = await ClubMembership.findById(applicationId)
      .populate('userId', 'fullName email username createdAt')
      .populate('clubId', 'clubName clubtype')
      .populate('decidedBy', 'fullName email');

    if (!application || application.role !== 'representative') {
      throw new Error('Club representative application not found');
    }

    return {
      application,
      reviewGuidelines: {
        checkPoints: [
          'Verify student identity and contact club officials',
          'Confirm position availability within club',
          'Validate official email and phone provided',
          'Review statement for authenticity'
        ],
        reviewMethods: ['email', 'phone'],
        approvalCriteria: [
          'Student holds claimed position in club',
          'Club officials confirm representative status',
          'Contact information verified',
          'No conflicts with existing representatives'
        ]
      }
    };
  }

  /* Keep all other existing methods unchanged... */
  static async requestClubRepresentation(studentId: string, clubId: string, notes?: string) {
    if (await this.studentHasActiveOrPendingRep(studentId)) {
      throw new Error('You already represent a club or have a pending request');
    }

    const student = await User.findById(studentId);
    const club = await Club.findById(clubId);

    if (!student || student.role !== 'student') {
      throw new Error('Only students can request club representation');
    }

    if (!club || !club.isActive) {
      throw new Error('Club not found or inactive');
    }

    const membership = new ClubMembership({
      userId: new Types.ObjectId(studentId),
      clubId: new Types.ObjectId(clubId),
      role: 'representative',
      status: 'pending',
      requestedAt: new Date()
    });

    await membership.save();

    return {
      message: 'Club representative request submitted successfully',
      membership
    };
  }

  static async getStudentApplications(studentId: string) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    const applications = await ClubMembership.find({
      userId: new Types.ObjectId(studentId),
      role: 'representative'
    })
      .populate('clubId', 'clubName clubtype')
      .populate('decidedBy', 'fullName email')
      .sort({ requestedAt: -1 });

    return {
      applications: applications.map(app => ({
        _id: app._id,
        club: app.clubId,
        clubPosition: app.clubPosition,
        status: app.status,
        requestedAt: app.requestedAt,
        decidedAt: app.decidedAt,
        adminNotes: app.adminNotes
      })),
      currentStatus: student.clubRepresentative
    };
  }

  static async getAvailableClubs(studentId: string) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    const clubs = await Club.find({
      isActive: true,
      isApproved: true
    }).select('clubName clubtype department description');

    const appliedClubs = await ClubMembership.find({
      userId: new Types.ObjectId(studentId),
      role: 'representative'
    }).select('clubId');

    const appliedClubIds = appliedClubs.map(app => app.clubId.toString());
    const availableClubs = clubs.filter(
      club => !appliedClubIds.includes(club._id.toString())
    );

    return {
      clubs: availableClubs,
      canCreateNew: true, // ✅ Now supports new club creation
      totalAvailable: availableClubs.length
    };
  }

  static async canRequestRepresentation(studentId: string) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return {
        canRequest: false,
        reason: 'Only students can request club representation'
      };
    }

    if (await this.studentHasActiveOrPendingRep(studentId)) {
      return {
        canRequest: false,
        reason: 'You already represent a club or have a pending request'
      };
    }

    return {
      canRequest: true,
      reason: 'Eligible to request club representation'
    };
  }

  static async cancelRepresentativeRequest(studentId: string, membershipId: string) {
    const membership = await ClubMembership.findOne({
      _id: membershipId,
      userId: new Types.ObjectId(studentId),
      role: 'representative',
      status: 'pending'
    });

    if (!membership) {
      throw new Error('Pending representative request not found');
    }

    membership.status = 'revoked';
    membership.decidedAt = new Date();
    await membership.save();

    return {
      message: 'Representative request cancelled successfully',
      membership
    };
  }

  static async getClubDetails(studentId: string) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    if (!student.clubRepresentative?.isActive) {
      throw new Error('Not an active club representative');
    }

    const club = await Club.findById(student.clubRepresentative.clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    const otherRepresentatives = await User.find({
      'clubRepresentative.isActive': true,
      'clubRepresentative.clubId': student.clubRepresentative.clubId,
      _id: { $ne: student._id }
    }).select('fullName email username');

    return {
      club,
      otherRepresentatives: {
        count: otherRepresentatives.length,
        representatives: otherRepresentatives
      }
    };
  }
}
