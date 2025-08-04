import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  username: string;
  password: string; 
  role: 'student' | 'faculty' | 'admin';
  
  semester?: number; 
  collegeName: string;
  department: string;

  // Admin profile
  adminProfile?: {
    adminLevel: 'super' | 'college' | 'department';
    permissions: string[];
    canModerate: boolean;
    canManageClubs: boolean;
  }

  // Updated faculty profile with rejection fields
  facultyProfile?: {
    isApproved: boolean;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    department: string;
    employeeId?: string;
    designation?: string;
    
    // Add rejection fields
    rejectedBy?: Types.ObjectId;
    rejectedAt?: Date;
    rejectionNotes?: string;
  };


   clubRepresentative?: {
    isActive: boolean;
    clubId: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionNotes?: string;
  };

  profilePicture?: string;
  bio?: string;
  phone?: string;
  
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}
