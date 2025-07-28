import { Document , Types } from 'mongoose';


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
  

// In User entity
adminProfile?: {
  adminLevel: 'super' | 'college' | 'department';
  permissions: string[];
  canModerate: boolean;
  canManageClubs: boolean;
}

  
  profilePicture?: string;
  bio?: string;
  phone?: string;
  
  
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}


