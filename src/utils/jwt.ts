// utils/jwt.ts
import jwt, { SignOptions, JwtPayload, Algorithm, VerifyOptions } from 'jsonwebtoken';
import { toExpiresIn } from '../helpers/jwt';

type Role = 'student' | 'admin';

// Strongly-typed payloads
export type AccessPayload = JwtPayload & { userId: string; role: Role; tokenType: 'access' };
export type RefreshPayload = JwtPayload & { userId: string; tokenType: 'refresh' };

// Secrets
const ACCESS_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_JWT_SECRET || ACCESS_SECRET;

// Expirations (validated to jsonwebtoken's accepted union)
const ACCESS_EXPIRES: SignOptions['expiresIn'] = toExpiresIn(process.env.JWT_EXPIRES_IN, '7d');
const REFRESH_EXPIRES: SignOptions['expiresIn'] = toExpiresIn(process.env.REFRESH_TOKEN_EXPIRES_IN, '30d');

// Crypto/claims
const ALG: Algorithm = (process.env.JWT_ALG as Algorithm) || 'HS256';
const ISSUER = process.env.JWT_ISSUER;     // e.g., 'https://myauth.example'
const AUDIENCE = process.env.JWT_AUDIENCE; // e.g., 'myeventease-api'
const CLOCK_TOLERANCE = parseInt(process.env.JWT_CLOCK_TOLERANCE_SECONDS || '0', 10);

export function signAccessToken(userId: string, role: Role, opts: Partial<SignOptions> = {}): string {
  const payload: AccessPayload = { userId, role, tokenType: 'access' };
  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRES,
    algorithm: ALG,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: userId, // sub
    ...opts,
  };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(userId: string, opts: Partial<SignOptions> = {}): string {
  const payload: RefreshPayload = { userId, tokenType: 'refresh' };
  const options: SignOptions = {
    expiresIn: REFRESH_EXPIRES,
    algorithm: ALG,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: userId,
    ...opts,
  };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessPayload {
  const options: VerifyOptions = {
    algorithms: [ALG],
    
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: CLOCK_TOLERANCE,
  };
  const decoded = jwt.verify(token, ACCESS_SECRET, options) as JwtPayload;
  if ((decoded as any)?.tokenType !== 'access') throw new Error('Invalid or expired token');
  return decoded as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const options: VerifyOptions = {
    algorithms: [ALG],
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: CLOCK_TOLERANCE,
  };
  const decoded = jwt.verify(token, REFRESH_SECRET, options) as JwtPayload;
  if ((decoded as any)?.tokenType !== 'refresh') throw new Error('Invalid refresh token');
  return decoded as RefreshPayload;
}

// Optional: quick read of standard timestamps (non-verifying)
export function getTimestamps(token: string) {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return { exp: decoded?.exp, iat: decoded?.iat, nbf: decoded?.nbf };
}
