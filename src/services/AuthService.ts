import { User } from '../models/User';
import { IUser } from '../models/interfaces/IUser';
// Correct if functions are in utils/jwt.ts
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
type Role = 'student' | 'admin';

export class AuthService {
  // Register new user
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
    const or: any[] = [{ email: userData.email }];
    if (userData.username && userData.username.trim() !== '') {
      or.push({ username: userData.username });
    }

    const existingUser = await User.findOne({ $or: or });
    if (existingUser) {
      const err: any = new Error('User with this email or username already exists');
      err.code = 11000;
      err.keyPattern = existingUser.email === userData.email ? { email: 1 } : { username: 1 };
      err.keyValue = existingUser.email === userData.email ? { email: userData.email } : { username: userData.username };
      throw err;
    }

    const user = new User(userData);
    await user.save();

    const token = signAccessToken(user._id.toString(), user.role as Role);
    const refreshToken = signRefreshToken(user._id.toString());

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

    const token = signAccessToken(user._id.toString(), user.role as Role);
    const refreshToken = signRefreshToken(user._id.toString());

    const { password: _, ...userResponse } = user.toObject();

    return {
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    };
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
    ).select('-password');

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

    user.password = newPassword; // pre('save') will hash in schema
    await user.save();

    return { data: {} };
  }

  // Refresh token
  static async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await this.getUserById(decoded.userId as string);

    const newToken = signAccessToken(user._id.toString(), user.role as Role);
    const newRefreshToken = signRefreshToken(user._id.toString());

    return {
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    };
  }
}
