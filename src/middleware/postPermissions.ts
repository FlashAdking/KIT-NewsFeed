import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/interfaces/IUser';
import { Post } from '../models/Post';
import { Types } from 'mongoose';

// Only declare this ONCE in your entire project


// Check if user can create posts
export const canCreatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Faculty must be approved
    if (user.role === 'faculty') {
      if (!user.facultyProfile?.isApproved) {
        return res.status(403).json({ 
          message: 'Faculty approval required to create posts',
          code: 'FACULTY_NOT_APPROVED'
        });
      }
    }
    
    // Students must be club representatives
    else if (user.role === 'student') {
      if (!user.clubRepresentative?.isActive) {
        return res.status(403).json({ 
          message: 'Club representative status required to create posts',
          code: 'NOT_CLUB_REPRESENTATIVE'
        });
      }
    }
    
    // Admins can always create posts
    else if (user.role === 'admin') {
      // Admin can create posts
    }
    
    else {
      return res.status(403).json({ 
        message: 'Invalid user role for post creation' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ message: 'Permission check failed' });
  }
};

// Check if user can edit specific post
export const canEditPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const postId = req.params.postId || req.params.id;
    
    if (!user || !postId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Admins can edit any post
    if (user.role === 'admin') {
      return next();
    }
    
    // Club representatives can only edit their club's posts
    if (user.role === 'student' && user.clubRepresentative?.isActive) {
      if (post.authorType === 'club' && 
          post.clubId?.toString() === user.clubRepresentative.clubId.toString()) {
        return next();
      }
      return res.status(403).json({ 
        message: 'Can only edit your club\'s posts' 
      });
    }
    
    // Faculty can only edit their own posts
    if (user.role === 'faculty' && user.facultyProfile?.isApproved) {
      if (post.authorType === 'faculty' && 
          post.createdBy.toString() === user._id.toString()) {
        return next();
      }
      return res.status(403).json({ 
        message: 'Can only edit your own posts' 
      });
    }
    
    return res.status(403).json({ 
      message: 'Insufficient permissions to edit this post' 
    });
    
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ message: 'Permission check failed' });
  }
};

// Check if user can delete specific post
export const canDeletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const postId = req.params.postId || req.params.id;
    
    if (!user || !postId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Admins can delete any post
    if (user.role === 'admin') {
      return next();
    }
    
    // Club representatives can only delete their club's posts
    if (user.role === 'student' && user.clubRepresentative?.isActive) {
      if (post.authorType === 'club' && 
          post.clubId?.toString() === user.clubRepresentative.clubId.toString()) {
        return next();
      }
      return res.status(403).json({ 
        message: 'Can only delete your club\'s posts' 
      });
    }
    
    // Faculty can only delete their own posts
    if (user.role === 'faculty' && user.facultyProfile?.isApproved) {
      if (post.authorType === 'faculty' && 
          post.createdBy.toString() === user._id.toString()) {
        return next();
      }
      return res.status(403).json({ 
        message: 'Can only delete your own posts' 
      });
    }
    
    return res.status(403).json({ 
      message: 'Insufficient permissions to delete this post' 
    });
    
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ message: 'Permission check failed' });
  }
};

// Check if user can moderate posts
export const canModeratePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Only admins with moderation permissions can moderate
    if (user.role === 'admin' && user.adminProfile?.canModerate) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Admin moderation permissions required' 
    });
    
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ message: 'Permission check failed' });
  }
};
