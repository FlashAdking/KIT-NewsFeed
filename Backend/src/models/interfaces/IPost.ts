
import { Document, Types } from 'mongoose';

export interface IPost extends Document {
  _id: Types.ObjectId;
  
  // Basic Info
  title: string;
  content: string;
  
  // Single image (simplified from media array)
  imageUrl?: string;
  
  // Author Info
  createdBy?: Types.ObjectId;
  authorType: 'club' | 'faculty' | 'admin';
  clubId?: Types.ObjectId;
  
  // Post Classification
  categoryId?: Types.ObjectId;
  postType: ;
  priority: 'low' | 'medium' | 'high';
  
  // Event-specific (only for postType === 'event')
  eventDetails?: {
    eventDate?: Date;
    eventTime?: string; // Store as "HH:MM" string
    venue?: string;
    maxParticipants?: number | null; // null = unlimited
  };
  
  registrationLink?: string;
  
  // Status & Moderation
  status: 'draft' | 'pending' | 'published' | 'rejected';
  moderatedBy?: Types.ObjectId;
  
  // Engagement
  likes: Types.ObjectId[];
  views: number;
  isPinned: boolean;
  
  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
