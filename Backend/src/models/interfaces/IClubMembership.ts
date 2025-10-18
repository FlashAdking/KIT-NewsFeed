import { Document , Types } from 'mongoose';

export interface IClubMembership extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId; // Reference to IUser
    clubId: Types.ObjectId; // Reference to IClub


    role: 'member' | 'representative' ; // Role within the club, e.g., member, representative

     // Permissions within the club

    status: 'pending' |  'approved' | 'rejected' | 'revoked'; // Membership status


    notes?: string; // Additional notes about the membership, e.g., reason for rejection

    //reqeuest tracking
    requestedAt: Date; // When the membership was requested
    decidedAt?: Date; // When the membership was decided(approved/rejected)
    decidedBy?: Types.ObjectId; // Reference to IUser who decided the membership status

    createdAt: Date; // When the membership was created
    updatedAt: Date; // When the membership was last updated
}