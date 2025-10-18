import { Document, Types } from 'mongoose';

export interface IPost extends Document {
    _id: Types.ObjectId;
    title: string;
    content: string;

    media?: {
        type: 'image' | 'document';
        url: string;
        filename?: string;        // ✅ FIXED: Made optional for external URLs
        size?: number;            // ✅ FIXED: Made optional for external URLs
        originalSize?: number;
        compressionRatio?: number;
        dimensions?: {
            width: number;
            height: number;
        };
    }[];

    createdBy?: Types.ObjectId;   // ✅ FIXED: Made optional
    authorType: 'club' | 'faculty' | 'admin';  // ✅ ADDED: 'admin'
    clubId?: Types.ObjectId;

    categoryId?: Types.ObjectId;  // ✅ FIXED: Made optional
    postType: 'announcement' | 'event' | 'news' | 'general';
    priority: 'low' | 'medium' | 'high';

    eventDetails?: {
        eventDate?: Date;          // ✅ FIXED: Made optional at type level
        venue?: string;            // ✅ FIXED: Made optional
        registrationRequired?: boolean;  // ✅ FIXED: Made optional
        registrationDeadline?: Date;
        maxParticipants?: number | null;  // ✅ FIXED: Allow null for unlimited
        
        registrationFee?: number;
        allowWaitlist?: boolean;
        requiresApproval?: boolean;
        
        description?: string;
        instructions?: string;
        contactInfo?: {
            email?: string;
            phone?: string;
        };
    };

    registrationLink?: string;

    registrationStats?: {
        totalRegistered: number;
        totalPaid: number;
        totalRevenue: number;
        waitlistCount: number;
    };

    status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
    moderatedBy?: Types.ObjectId;

    likes: Types.ObjectId[];
    views: number;
    isPinned: boolean;

    publishedAt?: Date;          
    scheduledFor?: Date;

    createdAt: Date;
    updatedAt: Date;
}
