import { Schema, model, Document, Types } from 'mongoose';

export interface IEventRegistration extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'registered' | 'waitlisted' | 'cancelled' | 'approved' | 'rejected';
  
  // Payment information
  payment: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
    method?: 'upi' | 'qr' | 'cash' | 'free';
    transactionId?: string;
    paidAt?: Date;
  };
  
  // Registration details
  registeredAt: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  
  // Additional info
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  status: {
    type: String,
    enum: ['registered', 'waitlisted', 'cancelled', 'approved', 'rejected'],
    default: 'registered'
  },
  
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    amount: { type: Number, default: 0 },
    method: {
      type: String,
      enum: ['upi', 'qr', 'cash', 'free']
    },
    transactionId: String,
    paidAt: Date
  },
  
  registeredAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  notes: { type: String, maxlength: 500 }
}, { timestamps: true });

// Compound index to prevent duplicate registrations
eventRegistrationSchema.index({ postId: 1, userId: 1 }, { unique: true });

// Indexes for efficient queries
eventRegistrationSchema.index({ postId: 1, status: 1 });
eventRegistrationSchema.index({ userId: 1, registeredAt: -1 });
eventRegistrationSchema.index({ 'payment.status': 1 });

export const EventRegistration = model<IEventRegistration>('EventRegistration', eventRegistrationSchema);
