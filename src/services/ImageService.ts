import sharp from 'sharp';
import multer from 'multer';
import { Buffer } from 'buffer';

// Memory storage is built into multer - no separate package needed
const storage = multer.memoryStorage(); // This works out of the box


export class ImageService {
  // Compress images based on type and usage
  static async compressImage(
    buffer: Buffer,
    imageType: 'profile' | 'cover' | 'club-logo' | 'event-media'
  ): Promise<{ buffer: Buffer; size: number; format: string }> {
    
    let quality = 80;
    let maxWidth = 1200;
    let maxHeight = 800;
    
    // Different compression settings based on usage
    switch (imageType) {
      case 'profile':
        maxWidth = 300;
        maxHeight = 300;
        quality = 85; // Higher quality for profile pics
        break;
        
      case 'club-logo':
        maxWidth = 200;
        maxHeight = 200;
        quality = 90; // High quality for logos
        break;
        
      case 'cover':
        maxWidth = 1200;
        maxHeight = 600;
        quality = 75; // Lower quality for large covers
        break;
        
      case 'event-media':
        maxWidth = 800;
        maxHeight = 600;
        quality = 70; // Balanced for event images
        break;
    }
    
    try {
      // Process image with Sharp
      const processedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer();
      
      return {
        buffer: processedBuffer,
        size: processedBuffer.length,
        format: 'jpeg'
      };
      
    } catch (error) {
      throw new Error(`Image compression failed: ${error}`);
    }
  }
  
  // Check if compression is needed
  static shouldCompress(buffer: Buffer, maxSizeKB: number = 500): boolean {
    const sizeInKB = buffer.length / 1024;
    return sizeInKB > maxSizeKB;
  }
  
  // Get compressed size info
  static getCompressionStats(originalSize: number, compressedSize: number) {
    const savings = originalSize - compressedSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);
    
    return {
      originalSizeKB: Math.round(originalSize / 1024),
      compressedSizeKB: Math.round(compressedSize / 1024),
      savingsKB: Math.round(savings / 1024),
      savingsPercent
    };
  }
}

