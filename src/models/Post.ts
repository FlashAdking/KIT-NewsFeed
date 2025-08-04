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
      url:      { type: String, required: true  , maxlength : 5000000 },
      filename: { type: String, required: true },
      size : {
        type : Number,
        required : true,
        max : 1000000 
      },
      originalSize : Number,
      compressionRatio : {
        type : Number,
        min : 0,
        max : 100
      },
      dimensions: {
        width : { type : Number , min : 1 , max : 4000},
        height : { type : Number , min : 1 , max : 4000}
      }
    }],

    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorType:  { type: String, enum: ['faculty', 'club'], required: true },
    clubId:      { type: Schema.Types.ObjectId, ref: 'Club' },

    categoryId:  { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    postType:    { type: String, enum: ['announcement', 'event', 'news', 'general'], default: 'event' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

    // ✅ UPDATED: Enhanced eventDetails for registration system
    eventDetails: {
      eventDate:            Date,
      venue:                String,
      registrationRequired: { type: Boolean, default: false },
      registrationDeadline: Date,
      maxParticipants:      { type: Number, default: 0 }, // 0 = unlimited
      
      // ✅ NEW: Payment & registration fields
      registrationFee:      { type: Number, default: 0 },     // ₹0 = free event
      allowWaitlist:        { type: Boolean, default: false }, // Enable waitlist when full
      requiresApproval:     { type: Boolean, default: false }, // Manual approval needed
      
      // ✅ NEW: Additional event info
      description:          String,                            // Event specific description
      instructions:         String,                            // Registration instructions
      contactInfo: {
        email:              String,
        phone:              String
      }
    },

    // ✅ UPDATED: Now optional since we have built-in registration
    registrationLink: String, // For external registration (Google Forms, etc.)

    // ✅ NEW: Registration statistics (updated by triggers)
    registrationStats: {
      totalRegistered:      { type: Number, default: 0 },
      totalPaid:           { type: Number, default: 0 },
      totalRevenue:        { type: Number, default: 0 },
      waitlistCount:       { type: Number, default: 0 }
    },

    status:      { type: String, enum: ['draft', 'pending', 'approved', 'published', 'rejected'], default: 'pending' },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    likes:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
    views:   { type: Number, default: 0 },
    isPinned:{ type: Boolean, default: false },

    publishedAt: Date,
    scheduledFor: Date
  },
  { timestamps: true }
);

// ✅ UPDATED: Enhanced validation for event posts
postSchema.pre('save', function (next) {
  // Check media size limits
  if (this.media && this.media.length > 0) {
    const totalSize = this.media.reduce((sum, item) => sum + (item.size || 0), 0);
    const maxTotalSize = 2 * 1024 * 1024; // 2MB
    
    if (totalSize > maxTotalSize) {
      return next(new Error(`Total media size (${Math.round(totalSize/1024)}KB) exceeds limit of ${Math.round(maxTotalSize/1024)}KB`));
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

// ✅ UPDATED: Additional indexes for registration queries
postSchema.index({ status: 1, categoryId: 1, priority: 1 });
postSchema.index({ authorType: 1, clubId: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'media.size' : 1});
postSchema.index({ postType: 1, 'eventDetails.eventDate': 1 }); // For event queries
postSchema.index({ 'eventDetails.registrationRequired': 1 });    // For registration-enabled events
postSchema.index({ 'eventDetails.registrationDeadline': 1 });    // For deadline queries

export const Post = model<IPost>('Post', postSchema);
