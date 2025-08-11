import { Request, Response, NextFunction } from 'express';

export const canCreatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = req.user;
    
    // Check user role and approval status
    switch (user.role) {
      case 'admin':
        // Admins can always create posts
        return next();
    
      case 'student':
        // Students need club representative approval
        const { ClubMembership } = await import('../models/ClubMembership');
        const membership = await ClubMembership.findOne({
          userId: user._id,
          role: 'representative',
          status: 'approved'
        });
        
        if (!membership) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Only faculty members and approved club representatives can create posts.'
          });
        }
        
        req.user.clubMembership = membership;
        return next();
        
      default:
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid user role for post creation'
        });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: 'Authorization check failed',
      message: error.message
    });
  }
};
