import { Document , Types } from 'mongoose';

export interface ISettings extends Document {
    _id: Types.ObjectId;
    key: string;
    value: any;
    description?: string;

    category:'general' | 'moderation' | 'notifications' | 'features';

    updatedBy?: Types.ObjectId; // Reference to IUser

    createdAt: Date; // When the setting was created
    updatedAt: Date;
}
