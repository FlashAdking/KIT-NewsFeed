import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "./interfaces/IUser";

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // ✅ This allows null/undefined without unique constraint violation
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: { type: String, required: true, enum: ["student", "admin"] },
    semester: { type: Number, min: 1, max: 8 },
    collegeName: { type: String, required: true },
    department: { type: String, required: false },
    adminProfile: {
      adminLevel: { type: String, enum: ["super", "college", "department"] },
      permissions: [{ type: String }],
      canModerate: Boolean,
      canManageClubs: Boolean,
    },
    profilePicture: String,
    bio: { type: String, maxlength: 500 },
    phone: { type: String, match: /^\+?[\d\s-()]{10,15}$/ },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    clubRepresentative: {
      isActive: { type: Boolean, default: false },
      clubId: { type: Schema.Types.ObjectId, ref: "Club" },
      clubPosition: String, // ✅ Add this if not present
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
      rejectedAt: Date,
      rejectionNotes: String,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { password, __v, ...sanitized } = ret;
        return sanitized;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const { password, __v, ...sanitized } = ret;
        return sanitized;
      },
    },
  }
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ✅ Compare password method
userSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

export const User = model<IUser>("User", userSchema);
