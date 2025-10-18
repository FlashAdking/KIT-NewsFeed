// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
// If you moved verifiers to utils/jwt:
import { verifyAccessToken } from '../utils/jwt'; // ← adjust path as needed

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.header('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token missing' });
    }

    // Use the existing verifier
    const decoded = verifyAccessToken(token); // ← was AuthService.verifyToken
    req.user = decoded; // contains userId, role, tokenType, iat, exp

    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
