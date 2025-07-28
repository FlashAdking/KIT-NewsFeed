import { Types, Document } from 'mongoose';

export interface IPost extends Document {

    _id: Types.ObjectId;
    title: string; // Title of the post
    content: string; // Content of the post

    media?: {
        type: 'image' | 'document'; // Type of media
        url: string; // URL of the media
        filename: string; // Filename of the media
    }[];


    // author information
    createdBy: Types.ObjectId; // Reference to IUser who created the post
    authorType: 'student' | 'faculty'; // Type of the author
    clubId?: Types.ObjectId; // Reference to IClub if the post is related to a club

    categoryId: Types.ObjectId; // Reference to ICategory for categorization
    postType: 'announcement' | 'event' | 'news' | 'general'; // Type of the post
    priority: 'low' | 'medium' | 'high'; // Priority of the post


    // event details if the post is an event
    eventDetails?: {
        eventDate: Date; // Date of the event
        venue: string; // Venue of the event
        registrationRequired: boolean; // Is registration required for the event
        registrationDeadline?: Date; // Deadline for registration
        maxParticipants?: number; // Maximum number of participants

    };

    registrationLink?: string; // URL to Google Form

    // This is in your IPost interface:
    status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';


    //engagement
    likes: Types.ObjectId[]; // Array of user IDs who liked the post
    views: number; // Number of views the post has received
    isPinned: boolean; // Whether the post is pinned or not

    //publishing
    publishedAt: Date; // When the post was published
    scheduledFor?: Date; // When the post is scheduled to be published

    //timestamps
    createdAt: Date; // When the post was created
    updatedAt: Date; // When the post was last updated


}