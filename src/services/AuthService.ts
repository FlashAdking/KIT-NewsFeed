import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { IUser } from '../models/interfaces/IUser';

export class AuthService {
    private static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
    private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
    private static readonly REFRESH_TOKEN_EXPIRES_IN: string = '30d';

    // Generate JWT token - Fixed with proper typing
    static generateToken(userId: string, role: string): string {
        return jwt.sign(
            { userId, role },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN } as any // Force any type
        );
    }

    // Generate refresh token - Fixed with proper typing
    static generateRefreshToken(userId: string): string {
        return jwt.sign(
            { userId },
            this.JWT_SECRET,
            { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN } as any // Force any type
        );
    }

    // Verify JWT token
    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // Register new user
    static async register(userData: {
        fullName: string;
        email: string;
        username: string;
        password: string;
        role: 'student' | 'faculty' | 'admin';
        semester?: number;
        collegeName: string;
        department: string;
        employeeId?: string;
        designation?: string;
    }) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: userData.email }, { username: userData.username }]
            });

            if (existingUser) {
                throw new Error('User with this email or username already exists');
            }

            // Prepare user data with role-specific profiles
            const newUserData: any = { ...userData };

            // If faculty, add pending approval status
            if (userData.role === 'faculty') {
                newUserData.facultyProfile = {
                    isApproved: false,
                    department: userData.department,
                    employeeId: userData.employeeId,
                    designation: userData.designation
                };
            }

            // Create new user
            const user = new User(newUserData);
            await user.save();

            // Generate tokens
            const token = this.generateToken(user._id.toString(), user.role);
            const refreshToken = this.generateRefreshToken(user._id.toString());

            // Remove password from response
            const { password, ...userResponse } = user.toObject();

            // Different message based on role
            const message = userData.role === 'faculty'
                ? 'Faculty registration submitted. Please wait for admin approval before you can create posts.'
                : 'User registered successfully';

            return {
                message,
                user: userResponse,
                token,
                refreshToken,
                requiresApproval: userData.role === 'faculty'
            };
        } catch (error: any) {
            throw new Error(error.message || 'Registration failed');
        }
    }


    // Login user
    static async login(email: string, password: string) {
        try {
            // Find user with password field
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact admin.');
            }

            // Compare password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens
            const token = this.generateToken(user._id.toString(), user.role);
            const refreshToken = this.generateRefreshToken(user._id.toString());

            // Remove password from response
            const { password: _, ...userResponse } = user.toObject();

            return {
                message: 'Login successful',
                user: userResponse,
                token,
                refreshToken
            };
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    }

    // Get user by ID
    static async getUserById(userId: string) {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch user');
        }
    }

    // Update user profile
    static async updateProfile(userId: string, updateData: Partial<IUser>) {
        try {
            const { password, role, isVerified, ...allowedUpdates } = updateData;

            const user = await User.findByIdAndUpdate(
                userId,
                allowedUpdates,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return {
                message: 'Profile updated successfully',
                user
            };
        } catch (error: any) {
            throw new Error(error.message || 'Profile update failed');
        }
    }

    // Change password
    static async changePassword(userId: string, currentPassword: string, newPassword: string) {
        try {
            const user = await User.findById(userId).select('+password');
            if (!user) {
                throw new Error('User not found');
            }

            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            user.password = newPassword;
            await user.save();

            return { message: 'Password changed successfully' };
        } catch (error: any) {
            throw new Error(error.message || 'Password change failed');
        }
    }

    // Refresh token
    static async refreshToken(refreshToken: string) {
        try {
            const decoded = this.verifyToken(refreshToken);
            const user = await this.getUserById(decoded.userId);

            const newToken = this.generateToken(user._id.toString(), user.role);
            const newRefreshToken = this.generateRefreshToken(user._id.toString());

            return {
                token: newToken,
                refreshToken: newRefreshToken
            };
        } catch (error: any) {
            throw new Error('Invalid refresh token');
        }
    }
}
