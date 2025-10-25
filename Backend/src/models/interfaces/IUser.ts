// src/models/interfaces/IUser.ts
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  username?: string; // ✅ Optional
  password: string;
  role: 'student' | 'admin';
  semester?: number;
  collegeName: string;
  department?: string;
  adminProfile?: {
    adminLevel?: 'super' | 'college' | 'department';
    permissions?: string[];
    canModerate?: boolean;
    canManageClubs?: boolean;
  };
  profilePicture?: string;
  bio?: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  clubRepresentative?: {
    isActive: boolean;
    clubId?: Types.ObjectId;
    ClubName?: string; // ✅ Add this if not present
    clubPosition?: string;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionNotes?: string;
  };
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}
