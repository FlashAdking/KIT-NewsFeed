import { Document, Types } from 'mongoose';

export interface IPost extends Document {
    _id: Types.ObjectId;
    title: string;
    content: string;

    media?: {
        type: 'image' | 'document';
        url: string;
        filename: string;
        size: number;
        originalSize?: number;
        compressionRatio?: number;
        dimensions? : {
            width : number;
            height : number;
        };
    }[];

    createdBy: Types.ObjectId;
    authorType: 'club' | 'faculty';
    clubId?: Types.ObjectId;

    categoryId: Types.ObjectId;
    postType: 'announcement' | 'event' | 'news' | 'general';
    priority: 'low' | 'medium' | 'high';

    // ✅ UPDATED: Enhanced eventDetails
    eventDetails?: {
        eventDate: Date;
        venue: string;
        registrationRequired: boolean;
        registrationDeadline?: Date;
        maxParticipants?: number;
        
        // ✅ NEW: Registration fields
        registrationFee?: number;
        allowWaitlist?: boolean;
        requiresApproval?: boolean;
        
        // ✅ NEW: Additional info
        description?: string;
        instructions?: string;
        contactInfo?: {
            email?: string;
            phone?: string;
        };
    };

    registrationLink?: string;

    // ✅ NEW: Registration statistics
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

    publishedAt: Date;
    scheduledFor?: Date;

    createdAt: Date;
    updatedAt: Date;
}
