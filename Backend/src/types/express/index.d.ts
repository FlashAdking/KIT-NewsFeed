// Backend/src/types/express/index.d.ts
import 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      user?: any;
    }
  }
}
