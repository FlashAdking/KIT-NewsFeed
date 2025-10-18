import { User } from '../models/User';
import { IUser } from '../models/interfaces/IUser';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Types } from 'mongoose';

type Role = 'student' | 'admin';

export class AuthService {
  // ✅ FIXED Register method
  static async register(userData: {
    fullName: string;
    email: string;
    username?: string;
    password: string;
    role: Role;
    semester?: number;
    collegeName: string;
    department?: string;
  }) {
    // Only check email for duplicates
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      const err: any = new Error('User with this email already exists');
      err.code = 11000;
      err.keyPattern = { email: 1 };
      err.keyValue = { email: userData.email };
      throw err;
    }

    const user = new User(userData);
    await user.save();

    // ✅ Fixed TypeScript error
    const userId = user._id instanceof Types.ObjectId ? user._id.toString() : String(user._id);
    const token = signAccessToken(userId, user.role as Role);
    const refreshToken = signRefreshToken(userId);

    const { password, ...userResponse } = user.toObject();

    return {
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    };
  }

  // Login user
  static async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account is deactivated. Please contact admin.');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    user.lastLogin = new Date();
    await user.save();

    // ✅ Fixed TypeScript error
    const userId = user._id instanceof Types.ObjectId ? user._id.toString() : String(user._id);
    const token = signAccessToken(userId, user.role as Role);
    const refreshToken = signRefreshToken(userId);

    const { password: _, ...userResponse } = user.toObject();

    return {
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    };
  }

  // Get user profile with club representative details
  static async getProfile(userId: string) {
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'clubRepresentative.clubId',
        select: 'clubName clubtype department'
      })
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Get user by ID
  static async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }

  // Update user profile
  static async updateProfile(userId: string, updateData: Partial<IUser>) {
    const { password, role, isVerified, ...allowedUpdates } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate({
        path: 'clubRepresentative.clubId',
        select: 'clubName clubtype department'
      })
      .lean();

    if (!user) throw new Error('User not found');

    return {
      data: { user },
    };
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found');

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) throw new Error('Current password is incorrect');

    user.password = newPassword;
    await user.save();

    return { data: {} };
  }

  // Refresh token
  static async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await this.getUserById(decoded.userId as string);

    // ✅ Fixed TypeScript error
    const userId = user._id instanceof Types.ObjectId ? user._id.toString() : String(user._id);
    const newToken = signAccessToken(userId, user.role as Role);
    const newRefreshToken = signRefreshToken(userId);

    return {
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    };
  }
}
