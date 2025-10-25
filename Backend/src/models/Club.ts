import { Schema, model } from 'mongoose';
import { IClub } from './interfaces/IClub';

const clubSchema = new Schema<IClub>(
  {
    clubName:      { type: String, required: true, trim: true, maxlength: 100 },
    description:   { type: String, required: true, maxlength: 1000 },
    collegeName:   { type: String, required: true },
    department:    String,
    establishedYear: { type: Number, min: 1900, max: new Date().getFullYear() },
    clubtype: {
      type: String,
      enum: ['cultural', 'sports', 'technical', 'social', 'entrepreneurship', 'arts', 'literary', 'music', 'dance'],
      required: true
    },
    logo:       String,
    coverImage: String,
    email:      { type: String, match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/ },
    isActive:   { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

clubSchema.index({ collegeName: 1, clubName: 1 }, { unique: true });

export const Club = model<IClub>('Club', clubSchema);

