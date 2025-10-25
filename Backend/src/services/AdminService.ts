import { User } from '../models/User';
import { ClubMembership } from '../models/ClubMembership';
import { IUser } from '../models/interfaces/IUser';
import mongoose, { Types } from 'mongoose';
import path from 'path';
import { Club } from '../models/Club'; // ✅ Add this import at the top
import fs from 'fs';

export class AdminService {
  
  // Promote user to admin
  static async promoteToAdmin(
    promoterId: string, 
    targetUserId: string, 
    adminLevel: 'super' | 'college' | 'department',
    permissions: string[]
  ) {
    try {
      // Verify promoter has permission
      const promoter = await User.findById(promoterId);
      if (!promoter || !this.canPromoteToLevel(promoter, adminLevel)) {
        throw new Error('Insufficient permissions to promote user');
      }
      
      // Get target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }
      
      // Update user to admin
      targetUser.role = 'admin';
      targetUser.adminProfile = {
        adminLevel,
        permissions,
        canModerate: permissions.includes('moderate_posts'),
        canManageClubs: permissions.includes('manage_clubs')
      };
      
      await targetUser.save();
      
      return {
        message: `User promoted to ${adminLevel} admin successfully`,
        user: targetUser
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to promote user');
    }
  }
  
  // ✅ FIXED: Check if admin can promote to specific level
  static canPromoteToLevel(admin: IUser, targetLevel: string): boolean {
    // ✅ Add null check for adminProfile
    if (!admin.adminProfile || !admin.adminProfile.adminLevel) {
      return false;
    }
    
    const hierarchyMap: Record<string, string[]> = {
      'super': ['super', 'college', 'department'],
      'college': ['college', 'department'], 
      'department': ['department']
    };
    
    // ✅ Now TypeScript knows adminLevel is defined
    return hierarchyMap[admin.adminProfile.adminLevel]?.includes(targetLevel) || false;
  }

  // Enhanced: Approve club membership (handles both regular members and representatives)
  static async approveClubMembership(
    adminId: string,
    membershipId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) {
    try {
      const admin = await User.findById(adminId);
      if (!admin || !admin.adminProfile?.canManageClubs) {
        throw new Error('Permission denied: Cannot manage club memberships');
      }
      
      const membership = await ClubMembership.findById(membershipId)
        .populate('userId')
        .populate('clubId');
        
      if (!membership) {
        throw new Error('Membership request not found');
      }

      if (membership.status !== 'pending') {
        throw new Error('Membership request has already been processed');
      }
      
      // Update membership status
      membership.status = decision;
      membership.decidedBy = new Types.ObjectId(adminId);
      membership.decidedAt = new Date();
      if (notes) {
        membership.notes = notes;
      }

      // If this is a representative request, update user profile
      if (membership.role === 'representative' && decision === 'approved') {
        const student = await User.findById(membership.userId);
        if (student) {
          student.clubRepresentative = {
            isActive: true,
            clubId: membership.clubId as Types.ObjectId,
            clubPosition: membership.clubPosition || 'Representative',
            approvedBy: new Types.ObjectId(adminId),
            approvedAt: new Date()
          };
          await student.save();
        }
      }
      
      await membership.save();
      
      return {
        message: `Club membership ${decision} successfully`,
        membership
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process membership');
    }
  }
  
  // Enhanced: Get pending club membership requests (separates members and representatives)
  static async getPendingClubMemberships(adminId: string) {
    try {
      const admin = await User.findById(adminId);
      if (!admin || !admin.adminProfile?.canManageClubs) {
        throw new Error('Permission denied');
      }
      
      const pendingMemberships = await ClubMembership.find({ 
        status: 'pending' 
      })
      .populate('userId', 'fullName email username department semester')
      .populate('clubId', 'clubName clubtype department')
      .sort({ requestedAt: -1 });

      // Separate regular members and representatives
      const regularMembers = pendingMemberships.filter(m => m.role === 'member');
      const representatives = pendingMemberships.filter(m => m.role === 'representative');
      
      return {
        total: pendingMemberships.length,
        regularMembers: {
          count: regularMembers.length,
          requests: regularMembers
        },
        representatives: {
          count: representatives.length,
          requests: representatives
        }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch pending memberships');
    }
  }

  // Get pending club representative requests specifically
  static async getPendingRepresentativeRequests(adminId: string) {
    try {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Check if admin has permission to manage clubs
      if (!admin.adminProfile?.canManageClubs && admin.adminProfile?.adminLevel !== 'super') {
        throw new Error('Insufficient permissions to manage club representatives');
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
        requests: pendingRequests
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch pending representative requests');
    }
  }

  // Process club representative requests specifically
  static async processRepresentativeRequest(
  adminId: string,
  membershipId: string,
  decision: 'approved' | 'rejected',
  notes?: string
) {
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Check admin permissions
    if (!admin.adminProfile?.canManageClubs && admin.adminProfile?.adminLevel !== 'super') {
      throw new Error('Insufficient permissions to manage club representatives');
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
    
    // Update membership status
    membership.status = decision;
    membership.decidedBy = new Types.ObjectId(adminId);
    membership.decidedAt = new Date();
    if (notes) {
      membership.notes = notes;
    }
    
    if (decision === 'approved') {
      // Update user to have club representative access
      const student = await User.findById(membership.userId);
      if (student) {
        student.clubRepresentative = {
          isActive: true,
          clubId: membership.clubId as Types.ObjectId,
          clubPosition: membership.clubPosition || 'Representative',
          approvedBy: new Types.ObjectId(adminId),
          approvedAt: new Date()
        };
        await student.save();
      }
      
      console.log(`✅ Club representative approved: ${student?.fullName} for club: ${(membership.clubId as any)?.clubName} by admin: ${admin.fullName}`);
    } 
    else {
      // REJECTION LOGIC
      const student = await User.findById(membership.userId);
      if (student) {
        if (!student.clubRepresentative) {
          student.clubRepresentative = {
            isActive: false
          };
        }
        student.clubRepresentative.rejectedAt = new Date();
        student.clubRepresentative.rejectionNotes = notes;
        await student.save();
      }

      // ✅ DELETE CLUB IF CONDITIONS MET (with case-insensitive check)
      const club = await Club.findById(membership.clubId);
      
      if (club) {
        // Check if this club was created by this user
        const wasCreatedByThisUser = club.createdBy?.toString() === membership.userId.toString();
        
        // Count other memberships (approved or pending) for this club
        const otherMemberships = await ClubMembership.countDocuments({
          clubId: club._id,
          _id: { $ne: membership._id }, // Exclude current membership
          status: { $in: ['pending', 'approved'] }
        });

        // Delete club if conditions are met
        if (wasCreatedByThisUser && otherMemberships === 0 && !club.isApproved) {
          // ✅ Also check for duplicate clubs with same name (case-insensitive)
          // before deleting to ensure clean state
          const duplicateClubs = await Club.find({
            collegeName: club.collegeName,
            clubName: { $regex: new RegExp(`^${club.clubName}$`, 'i') }, // Case-insensitive
            _id: { $ne: club._id } // Exclude current club
          });

          // Delete all duplicates created by this user with no members
          for (const dupClub of duplicateClubs) {
            if (dupClub.createdBy?.toString() === membership.userId.toString()) {
              const dupMembers = await ClubMembership.countDocuments({
                clubId: dupClub._id,
                status: { $in: ['pending', 'approved'] }
              });
              
              if (dupMembers === 0) {
                await Club.findByIdAndDelete(dupClub._id);
                console.log(`🗑️ Deleted duplicate club: ${dupClub.clubName}`);
              }
            }
          }

          // Delete the main club
          await Club.findByIdAndDelete(club._id);
          console.log(`🗑️ Deleted club: ${club.clubName} (created by rejected user, no other members)`);
        }
      }

      // DELETE VERIFICATION DOCUMENT FILE
      if (membership.verificationDocument?.path) {
        const filePath = path.join(__dirname, '../../', membership.verificationDocument.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted verification file: ${membership.verificationDocument.filename}`);
        }
      }
      
      console.log(`❌ Club representative rejected: ${student?.fullName} for club: ${(membership.clubId as any)?.clubName} by admin: ${admin.fullName}`);
    }
    
    await membership.save();
    
    return {
      message: `Club representative request ${decision} successfully`,
      membership: {
        _id: membership._id,
        userId: membership.userId,
        clubId: membership.clubId,
        role: membership.role,
        status: membership.status,
        notes: membership.notes,
        requestedAt: membership.requestedAt,
        decidedAt: membership.decidedAt,
        decidedBy: membership.decidedBy
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to process representative request');
  }
}


  // Get club representative history
  static async getRepresentativeHistory(adminId: string, limit: number = 50) {
    try {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      const history = await ClubMembership.find({
        role: 'representative',
        status: { $in: ['approved', 'rejected'] }
      })
      .populate('userId', 'fullName email username')
      .populate('clubId', 'clubName clubtype department')
      .populate('decidedBy', 'fullName email')
      .sort({ decidedAt: -1 })
      .limit(limit);
      
      return history;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch representative history');
    }
  }
  
  // Grant specific permissions to user
  static async grantPermissions(
    adminId: string,
    targetUserId: string, 
    newPermissions: string[]
  ) {
    try {
      const admin = await User.findById(adminId);
      const targetUser = await User.findById(targetUserId);
      
      if (!admin || !targetUser) {
        throw new Error('User not found');
      }
      
      // Check admin has permission to grant these permissions
      if (!this.canGrantPermissions(admin, newPermissions)) {
        throw new Error('Insufficient permissions to grant these permissions');
      }
      
      // Add new permissions
      if (targetUser.adminProfile) {
        const existingPermissions = targetUser.adminProfile.permissions || [];
        targetUser.adminProfile.permissions = [...new Set([...existingPermissions, ...newPermissions])];
        
        // Update related flags
        targetUser.adminProfile.canModerate = targetUser.adminProfile.permissions.includes('moderate_posts');
        targetUser.adminProfile.canManageClubs = targetUser.adminProfile.permissions.includes('manage_clubs');
      }
      
      await targetUser.save();
      
      return {
        message: 'Permissions granted successfully',
        user: targetUser
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to grant permissions');
    }
  }
  
  // ✅ FIXED: Can grant permissions check
  private static canGrantPermissions(admin: IUser, permissions: string[]): boolean {
    // ✅ Add null check
    if (!admin.adminProfile || !admin.adminProfile.adminLevel) {
      return false;
    }
    
    const adminPermissions = admin.adminProfile.permissions || [];
    
    // Super admin can grant any permission
    if (admin.adminProfile.adminLevel === 'super') {
      return true;
    }
    
    // Other admins can only grant permissions they have
    return permissions.every(permission => adminPermissions.includes(permission));
  }
}
