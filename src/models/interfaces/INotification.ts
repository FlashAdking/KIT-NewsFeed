import { Document , Types } from 'mongoose';

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId; // Reference to IUser

    //
    type: "new_post" | "club_request_approved" | "club_request_rejected" | "comment_added" | "post_like" | "event_reminder";
    title: string;
    message: string;

    //related entities
    relatedPostId?: Types.ObjectId; // Reference to IPost
    relatedClubId?: Types.ObjectId; // Reference to IClub
    relatedUserId?: Types.ObjectId; // Reference to IUser

    priority: "low" | "medium" | "high" | "urgent";

    isRead: boolean;
    readAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}
