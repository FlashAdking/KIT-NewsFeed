import { Schema, model, Document, Types } from 'mongoose';

export interface IClubMembership extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clubId: Types.ObjectId;

  /* membership role + workflow */
  role: 'member' | 'representative';
  status: 'pending' | 'approved' | 'rejected' | 'revoked';

  /* representative specifics */
  clubPosition?: 'president' | 'vice-president' | 'secretary' | 'coordinator' | 'treasurer';
  officialEmail?: string;
  officialPhone?: string;

  /* minimal application payload */
  applicationDetails?: {
    fullName: string;
    email: string;
    department: string;
    semester: number;
    clubPosition: string;
    officialEmail: string;
    officialPhone: string;
    statement: string;
    supportingDocUrl?: string;
  };

  /* admin workflow */
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: Types.ObjectId;
  adminNotes?: string;          // new detailed notes
  notes?: string;               // ← legacy field still used in AdminService
  reviewMethod?: 'email' | 'phone';
}

const membershipSchema = new Schema<IClubMembership>(
  {
    /* required refs */
    userId : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clubId : { type: Schema.Types.ObjectId, ref: 'Club', required: true },

    role   : { type: String, enum: ['member', 'representative'], default: 'member' },
    status : { type: String, enum: ['pending', 'approved', 'rejected', 'revoked'], default: 'pending' },

    clubPosition : { type: String, enum: ['president','vice-president','secretary','coordinator','treasurer'] },
    officialEmail: String,
    officialPhone: String,

    applicationDetails: {
      fullName        : String,
      email           : String,
      department      : String,
      semester        : Number,
      clubPosition    : String,
      officialEmail   : String,
      officialPhone   : String,
      statement       : String,
      supportingDocUrl: String
    },

    requestedAt : { type: Date, default: Date.now },
    decidedAt   : Date,
    decidedBy   : { type: Schema.Types.ObjectId, ref: 'User' },
    adminNotes  : String,
    notes       : String,  // ← legacy support
    reviewMethod: { type: String, enum: ['email', 'phone'] }
  },
  { timestamps: true }
);


/* 1️⃣  Unique pair (userId, clubId) so a student can’t apply twice for same club */
membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

/* 2️⃣  Enforce “one club per student” while status is pending or approved */
membershipSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: 'representative',
      status: { $in: ['pending', 'approved'] }
    }
  }
);

/* 3️⃣  Secondary indexes for faster dashboards */
membershipSchema.index({ role: 1, status: 1 });
membershipSchema.index({ requestedAt: -1 });
membershipSchema.index({ decidedAt: -1 });

export const ClubMembership = model<IClubMembership>('ClubMembership', membershipSchema);
