import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/Post';

export const canCreatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;

    // Allow faculty and club representatives to create posts
    if (user.role === 'admin') {
      return next();
    }

    // Check if club representative
    if (user.clubRepresentative?.isActive) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Only admins and active club representatives can create posts',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Permission check failed',
    });
  }
};

export const canEditPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Admins can edit any post
    if (user.role === 'admin') {
      return next();
    }

    // Check if user is the creator
    // ✅ FIXED: Added null check for createdBy
    if (post.createdBy && post.createdBy.toString() === user._id.toString()) {
      return next();
    }

    // Check if user is club representative for this post
    if (post.authorType === 'club' && 
        post.clubId && 
        user.clubRepresentative?.isActive &&
        user.clubRepresentative.clubId?.toString() === post.clubId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'You do not have permission to edit this post',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Permission check failed',
    });
  }
};

export const canDeletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Admins can delete any post
    if (user.role === 'admin') {
      return next();
    }

    // Check if user is the creator
    // ✅ FIXED: Added null check for createdBy
    if (post.createdBy && post.createdBy.toString() === user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'You do not have permission to delete this post',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Permission check failed',
    });
  }
};

export const canModeratePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;

    // Only admins can moderate
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can moderate posts',
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Permission check failed',
    });
  }
};
