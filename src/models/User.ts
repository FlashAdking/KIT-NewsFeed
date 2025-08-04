import { Schema, model, connect } from "mongoose";

import { IUser } from "./interfaces/IUser";

import bcrypt from 'bcrypt';


const userSchema = new Schema<IUser>({
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'faculty', 'admin'],

    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
    },
    collegeName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    adminProfile: {
        adminLevel: { type: String, enum: ['super', 'college', 'department'] },
        permissions: [{ type: String }],
        canModerate: Boolean,
        canManageClubs: Boolean
    },

    profilePicture: String,
    bio: {
        type: String,
        maxlength: 500
    },
    phone: {
        type: String,
        match: /^\+?[\d\s-()]{10,15}$/
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    facultyProfile: {
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: Date,
        department: String,
        employeeId: String,
        designation: {
            type: String,
            enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant']
        },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectedAt: Date,
        rejectionNotes: String
    },

    clubRepresentative: {
        isActive: { type: Boolean, default: false },
        clubId: { type: Schema.Types.ObjectId, ref: 'Club' },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: Date,
        rejectedAt: Date,
        rejectionNotes: String
    },

    lastLogin: Date
},
    {
        timestamps: true
    }


);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Helper method for login
userSchema.methods.comparePassword = function (plain: string) {
    return bcrypt.compare(plain, this.password);
};

userSchema.pre('save', function (next) {
    if (this.role === 'faculty' && !this.facultyProfile) {
        this.facultyProfile = {
            isApproved: false,
            department: this.department
        };
    }
    next();
});

export const User = model<IUser>('User', userSchema);

