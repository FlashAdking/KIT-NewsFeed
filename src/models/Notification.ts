
import { Schema, model } from 'mongoose';
import { INotification } from './interfaces/INotification';

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        type: {
            type: String,
            enum: [
                'new_post',
                'club_request_approved',
                'club_request_rejected',
                'comment_added',
                'post_like',
                'event_reminder'
            ],
            required: true
        },
        title: { type: String, required: true },
        message: { type: String, required: true },

        relatedPostId: { type: Schema.Types.ObjectId, ref: 'Post' },
        relatedClubId: { type: Schema.Types.ObjectId, ref: 'Club' },
        relatedUserId: { type: Schema.Types.ObjectId, ref: 'User' },

        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },

        isRead: { type: Boolean, default: false },
        readAt: Date
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
