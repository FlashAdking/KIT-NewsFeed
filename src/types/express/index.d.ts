// src/types/express/index.d.ts
export {};

declare global {
  namespace Express {
    interface Request {
      user?: any; // or a stricter User type
    }
  }
}
