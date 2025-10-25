// ============================================================================
// middleware/postPermissions.ts - FINAL VERSION
// ============================================================================
import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';

export const canCreatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtUser = req.user as any;
    const userId = jwtUser.userId || jwtUser._id;

    console.log('🔐 canCreatePost - User ID:', userId, 'Role:', jwtUser.role);

    // ✅ Allow admins
    if (jwtUser.role === 'admin') {
      console.log('✅ Admin approved');
      return next();
    }

    // ✅ Query User to check clubRepresentative status
    const user = await User.findById(userId).lean();
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    console.log('👤 User clubRepresentative:', user.clubRepresentative);

    // ✅ Check if active club representative
    if (user.clubRepresentative?.isActive && user.clubRepresentative?.clubId) {
      console.log('✅ Club rep approved');
      req.body.clubId = user.clubRepresentative.clubId;
      req.body.authorType = 'club';
      return next();
    }

    // ❌ Not authorized
    console.log('❌ Not authorized - Not admin or active club rep');
    return res.status(403).json({
      success: false,
      error: 'Only admins and active club representatives can create posts',
    });
  } catch (error: any) {
    console.error('❌ canCreatePost error:', error);
    return res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};

export const canEditPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtUser = req.user as any;
    const postId = req.params.id;
    const userId = jwtUser.userId || jwtUser._id;

    console.log('🔐 canEditPost - User:', userId, 'Post:', postId);

    const post = await Post.findById(postId).lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // ✅ Admin can edit any post
    if (jwtUser.role === 'admin') {
      console.log('✅ Admin can edit');
      return next();
    }

    // ✅ Post creator can edit
    if (post.createdBy && post.createdBy.toString() === userId.toString()) {
      console.log('✅ Creator can edit');
      return next();
    }

    // ❌ Not authorized
    console.log('❌ No edit permission');
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to edit this post',
    });
  } catch (error: any) {
    console.error('❌ canEditPost error:', error);
    return res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};

export const canDeletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtUser = req.user as any;
    const postId = req.params.id;
    const userId = jwtUser.userId || jwtUser._id;

    console.log('🔐 canDeletePost - User:', userId, 'Post:', postId);

    const post = await Post.findById(postId).lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // ✅ Admin can delete any post
    if (jwtUser.role === 'admin') {
      console.log('✅ Admin can delete');
      return next();
    }

    // ✅ Post creator can delete
    if (post.createdBy && post.createdBy.toString() === userId.toString()) {
      console.log('✅ Creator can delete');
      return next();
    }

    // ❌ Not authorized
    console.log('❌ No delete permission');
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to delete this post',
    });
  } catch (error: any) {
    console.error('❌ canDeletePost error:', error);
    return res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};

export const canModeratePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jwtUser = req.user as any;

    console.log('🔐 canModeratePost - Role:', jwtUser.role);

    // ✅ Only admins can moderate
    if (jwtUser.role !== 'admin') {
      console.log('❌ Not admin - cannot moderate');
      return res.status(403).json({
        success: false,
        error: 'Only admins can moderate posts',
      });
    }

    console.log('✅ Admin can moderate');
    next();
  } catch (error: any) {
    console.error('❌ canModeratePost error:', error);
    return res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};
