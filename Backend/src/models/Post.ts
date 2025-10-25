// ============================================================================
// models/Post.ts - CORRECTED VERSION
// ============================================================================
import { Schema, model } from 'mongoose';
import { IPost } from './interfaces/IPost';

const postSchema = new Schema<IPost>(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },

    // Single Image (simplified)
    imageUrl: {
      type: String,
      maxlength: 2000,
    },

    // Author Information
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    authorType: {
      type: String,
      enum: ['faculty', 'club', 'admin'],
      required: [true, 'Author type is required'],
    },

    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },

    // Classification
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },

    postType: {
      type: String,
      enum: [
        'event',
        'workshop',
        'competition',
        'hackathon',
        'seminar',
        'cultural',
        'sports',
        'recruitment',
        'announcement',
        'notice'
      ],
      default: 'event',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    // Event Details (optional, only for event-type posts)
    eventDetails: {
      eventDate: {
        type: Date,
      },
      eventTime: {
        type: String, // Store as "HH:MM"
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      },
      venue: {
        type: String,
        maxlength: 200,
      },
      maxParticipants: {
        type: Number,
        default: null, // null means unlimited
        min: [0, 'Max participants cannot be negative'], // ✅ FIX: Changed from 1 to 0
      },
    },

    registrationLink: {
      type: String,
      maxlength: 500,
    },

    // Status & Moderation
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'pending', // ✅ FIX: Changed from 'published' to 'pending' for moderation
    },

    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Engagement
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    views: {
      type: Number,
      default: 0,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    // Publishing
    publishedAt: Date,
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
postSchema.pre('save', function (next) {
  // ✅ FIX: Validate all event-type posts (not just 'event')
  const eventTypes = [
    'event',
    'workshop',
    'competition',
    'hackathon',
    'seminar',
    'cultural',
    'sports'
  ];

  if (eventTypes.includes(this.postType)) {
    if (!this.eventDetails?.eventDate) {
      return next(new Error('Event date is required for event-type posts'));
    }

    // ✅ FIX: Only validate future date for NEW posts (not on updates)
    if (this.isNew) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to start of day
      const eventDate = new Date(this.eventDetails.eventDate);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate < now) {
        return next(new Error('Event date must be today or in the future'));
      }
    }
  }

  // Auto-set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ postType: 1, 'eventDetails.eventDate': 1 });
postSchema.index({ authorType: 1, clubId: 1 });
postSchema.index({ categoryId: 1 });
postSchema.index({ createdBy: 1, status: 1 }); // ✅ ADDED: For user's posts

export const Post = model<IPost>('Post', postSchema);
