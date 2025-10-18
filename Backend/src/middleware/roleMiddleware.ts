import { Request, Response, NextFunction } from 'express';

// Admin only access
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 adminOnly middleware check');
  
  const user = req.user;
  
  if (!user) {
    console.log('❌ No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (user.role !== 'admin') {
    console.log(`❌ User role is "${user.role}", expected "admin"`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  console.log('✅ Admin check passed');
  next();
};

// Student only access
export const studentOnly = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 studentOnly middleware check');
  console.log('User object:', JSON.stringify(req.user, null, 2));
  
  const user = req.user;
  
  if (!user) {
    console.log('❌ No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (user.role !== 'student') {
    console.log(`❌ User role is "${user.role}", expected "student"`);
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }
  
  console.log('✅ Student check passed');
  next();
};

// Multiple roles allowed
export const allowRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`🔐 allowRoles middleware check for: [${roles.join(', ')}]`);
    
    const user = req.user;
    
    if (!user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(user.role)) {
      console.log(`❌ User role "${user.role}" not in allowed roles: [${roles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    console.log(`✅ Role check passed for "${user.role}"`);
    next();
  };
};

// Active club representative only
export const clubRepresentativeOnly = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 clubRepresentativeOnly middleware check');
  
  const user = req.user;
  
  if (!user) {
    console.log('❌ No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (user.role !== 'student') {
    console.log(`❌ User role is "${user.role}", expected "student"`);
    return res.status(403).json({
      success: false,
      message: 'Student access required for club representatives'
    });
  }
  
  if (!user.clubRepresentative?.isActive) {
    console.log('❌ User is not an active club representative');
    return res.status(403).json({
      success: false,
      message: 'Active club representative status required'
    });
  }
  
  console.log('✅ Club representative check passed');
  next();
};

// Optional: Student or Admin access (useful for some routes)
export const studentOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 studentOrAdmin middleware check');
  
  const user = req.user;
  
  if (!user) {
    console.log('❌ No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (user.role !== 'student' && user.role !== 'admin') {
    console.log(`❌ User role is "${user.role}", expected "student" or "admin"`);
    return res.status(403).json({
      success: false,
      message: 'Student or Admin access required'
    });
  }
  
  console.log(`✅ Access granted for role: ${user.role}`);
  next();
};
