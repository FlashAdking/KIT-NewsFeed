import { Document , Types } from 'mongoose';

export interface ICategory extends Document {
    _id : Types.ObjectId;
    name: string;
    slug: string; // URL-friendly: "hackathon", "tech-workshop"
    description?: string;
    

    // hirarchy:
    parentCategoryId?: Types.ObjectId; // Reference to ICategory

    //display
    displayOrder?: number; // For sorting categories in UI

    // status
    isActive: boolean;

    createdAt: Date;
    updatedAt?: Date;
}