import { Document , Types } from 'mongoose';

export interface IComment extends Document {

    _id: Types.ObjectId; 
    postId: Types.ObjectId; // reff to IPost
    userId: Types.ObjectId; // reff to IUser


    //content
    content: string; // Content of the comment
    parentCommentId?: Types.ObjectId; // Reference to the parent comment if this is a reply

    //engagement
    likes: Types.ObjectId[]; // Array of user IDs who liked the comment


    //status
    isEdited: boolean; // Whether the comment has been edited
    isDeleted: boolean; // Whether the comment has been deleted

    createdAt: Date; // When the comment was created
    updatedAt: Date; // When the comment was last updated


}