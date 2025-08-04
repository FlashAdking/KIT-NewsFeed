import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';



// Rest of your middleware code...
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);

    req.user = user; // TypeScript now knows this property exists
    next();
  } catch (error: any) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
};
