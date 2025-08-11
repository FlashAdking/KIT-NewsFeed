import { Request, Response, NextFunction } from 'express';

// Admin only access
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
};

// Student only access
export const studentOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }
  
  next();
};

// Faculty only access


// Multiple roles allowed
export const allowRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// Approved faculty only

// Active club representative only
export const clubRepresentativeOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }
  
  if (!user.clubRepresentative?.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Active club representative status required'
    });
  }
  
  next();
};
