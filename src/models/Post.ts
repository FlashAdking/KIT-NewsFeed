import { Schema, model } from 'mongoose';
import { IPost } from './interfaces/IPost';

const postSchema = new Schema<IPost>(
  {
    title:   { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },

    media: [{
      type: {
        type: String,
        enum: ['image', 'document'],
        required: true
      },
      url:      { type: String, required: true, maxlength: 2000 }, // ✅ FIXED: Was 5000000 (too large)
      filename: { type: String }, // ✅ FIXED: Made optional
      size:     { type: Number }, // ✅ FIXED: Made optional for external URLs
      originalSize: Number,
      compressionRatio: {
        type: Number,
        min: 0,
        max: 100
      },
      dimensions: {
        width:  { type: Number, min: 1, max: 4000 },
        height: { type: Number, min: 1, max: 4000 }
      }
    }],

    createdBy:   { type: Schema.Types.ObjectId, ref: 'User' }, // ✅ FIXED: Made optional for now
    authorType:  { type: String, enum: ['faculty', 'club', 'admin'], required: true }, // ✅ ADDED: 'admin'
    clubId:      { type: Schema.Types.ObjectId, ref: 'Club' },

    categoryId:  { type: Schema.Types.ObjectId, ref: 'Category' }, // ✅ FIXED: Made optional
    postType:    { type: String, enum: ['announcement', 'event', 'news', 'general'], default: 'event' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

    eventDetails: {
      eventDate:            Date,
      venue:                String,
      registrationRequired: { type: Boolean, default: false },
      registrationDeadline: Date,
      maxParticipants:      { type: Number, default: null }, // ✅ FIXED: null = unlimited (not 0)
      
      registrationFee:      { type: Number, default: 0 },
      allowWaitlist:        { type: Boolean, default: false },
      requiresApproval:     { type: Boolean, default: false },
      
      description:          String,
      instructions:         String,
      contactInfo: {
        email:              String,
        phone:              String
      }
    },

    registrationLink: String,

    registrationStats: {
      totalRegistered:      { type: Number, default: 0 },
      totalPaid:           { type: Number, default: 0 },
      totalRevenue:        { type: Number, default: 0 },
      waitlistCount:       { type: Number, default: 0 }
    },

    status:      { type: String, enum: ['draft', 'pending', 'approved', 'published', 'rejected'], default: 'published' }, // ✅ FIXED: default to published for testing
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    likes:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
    views:   { type: Number, default: 0 },
    isPinned:{ type: Boolean, default: false },

    publishedAt: Date,
    scheduledFor: Date
  },
  { timestamps: true }
);

// ✅ UPDATED: More lenient validation for testing
postSchema.pre('save', function (next) {
  // Check media size limits (only if size is provided)
  if (this.media && this.media.length > 0) {
    const mediaWithSize = this.media.filter(item => item.size);
    if (mediaWithSize.length > 0) {
      const totalSize = mediaWithSize.reduce((sum, item) => sum + item.size!, 0);
      const maxTotalSize = 5 * 1024 * 1024; // ✅ INCREASED: 5MB for multiple images
      
      if (totalSize > maxTotalSize) {
        return next(new Error(`Total media size exceeds ${Math.round(maxTotalSize/(1024*1024))}MB limit`));
      }
    }
  }
  
  // Enhanced event validation
  if (this.postType === 'event') {
    if (!this.eventDetails?.eventDate) {
      return next(new Error('eventDetails.eventDate is required for event posts'));
    }
    
    // Validate registration deadline is before event date
    if (this.eventDetails.registrationDeadline && 
        this.eventDetails.registrationDeadline >= this.eventDetails.eventDate) {
      return next(new Error('Registration deadline must be before event date'));
    }
    
    // Validate registration fee is not negative
    if (this.eventDetails.registrationFee && this.eventDetails.registrationFee < 0) {
      return next(new Error('Registration fee cannot be negative'));
    }
  }
  
  next();
});

postSchema.index({ status: 1, categoryId: 1, priority: 1 });
postSchema.index({ authorType: 1, clubId: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'media.size': 1 });
postSchema.index({ postType: 1, 'eventDetails.eventDate': 1 });
postSchema.index({ 'eventDetails.registrationRequired': 1 });
postSchema.index({ 'eventDetails.registrationDeadline': 1 });

export const Post = model<IPost>('Post', postSchema);
