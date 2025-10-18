 
import { Schema, model } from 'mongoose';
import { IComment } from './interfaces/IComment';

const commentSchema = new Schema<IComment>(
  {
    postId:  { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },

    content: { type: String, required: true, maxlength: 1000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },

    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    isEdited:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });

export const Comment = model<IComment>('Comment', commentSchema);
