 
import { Schema, model } from 'mongoose';
import { ISettings } from './interfaces/ISettings';

const settingsSchema = new Schema<ISettings>(
  {
    key:       { type: String, required: true, unique: true },
    value:     Schema.Types.Mixed,        // flexible type
    description: String,
    category: {
      type: String,
      enum: ['general', 'moderation', 'notifications', 'features'],
      required: true
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
