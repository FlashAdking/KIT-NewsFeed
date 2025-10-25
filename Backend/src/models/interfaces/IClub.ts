import { Document , Types } from 'mongoose';


export interface IClub extends Document {

    _id: Types.ObjectId;
    clubName: string;
    description: string;
    collegeName: string;
    department?: string;

    //club details
    establishedYear?: number;
    clubtype:  'cultural' | 'sports' | 'technical' | 'social' | 'entrepreneurship' | 'arts' | 'literary' | 'music' | 'dance';
    logo?: string;
    coverImage?: string;
    email?: string;


    //status
    isActive: boolean;
    isApproved: boolean;

    //system fields
    createdBy: Types.ObjectId; // Reference to IUser
    createdAt: Date;
    updatedAt: Date;

}