import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../services/ImageService';

// Memory storage for processing before saving
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer config with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max upload size
    files: 5 // Max 5 files per request
  }
});

// Compression middleware
export const compressAndValidate = (imageType: 'profile' | 'cover' | 'club-logo' | 'event-media') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file && !req.files) {
        return next(); // No files to process
      }
      
      // Handle single file
      if (req.file) {
        const compressed = await ImageService.compressImage(req.file.buffer, imageType);
        
        // Add compression stats to request for logging
        const stats = ImageService.getCompressionStats(req.file.size, compressed.size);
        console.log(`📸 Image compressed: ${stats.originalSizeKB}KB → ${stats.compressedSizeKB}KB (${stats.savingsPercent}% savings)`);
        
        // Replace file buffer with compressed version
        req.file.buffer = compressed.buffer;
        req.file.size = compressed.size;
        req.file.mimetype = `image/${compressed.format}`;
      }
      
      // Handle multiple files
      if (req.files && Array.isArray(req.files)) {
        for (let file of req.files) {
          const compressed = await ImageService.compressImage(file.buffer, imageType);
          file.buffer = compressed.buffer;
          file.size = compressed.size;
          file.mimetype = `image/${compressed.format}`;
        }
      }
      
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Image processing failed',
        message: error.message
      });
    }
  };
};

// Export upload handlers
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => upload.array(fieldName, maxCount);

