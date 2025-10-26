import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/mongodb';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import postRoutes from './routes/postRoutes';
import clubRepresentativeRoutes from './routes/clubRepresentativeRoutes';
import path from 'path';

dotenv.config();
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 3000;



const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default port
    'http://localhost:5174', // Backup Vite port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - reduces preflight requests
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));


// Configure Helmet AFTER CORS to avoid conflicts
// Reference: https://helmetjs.github.io/
app.use(
  helmet({
    // CRITICAL: Allow cross-origin images/assets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    
    // Content Security Policy - allows localhost resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:*', 'https://localhost:*'],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for some React features
        styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline for CSS-in-JS
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'], // API & WebSocket
        frameSrc: ["'self'"],
        frameAncestors: ["'self'", 'http://localhost:*'],
      },
    },
    
    // Don't send X-Powered-By header (security)
    hidePoweredBy: true,
  })
);


// Morgan logs HTTP requests - use 'combined' in production, 'dev' in development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));


// Parse JSON and URL-encoded bodies - must come before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CRITICAL: Add CORS middleware BEFORE express.static
// This fixes the ERR_BLOCKED_BY_RESPONSE.NotSameOrigin error
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // CRITICAL: This header allows cross-origin images to load
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Serve static files with proper headers
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res: Response, filePath: string) => {
      // Set correct MIME types
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
      };
      
      if (mimeTypes[ext]) {
        res.type(mimeTypes[ext]);
      }
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Cache static files for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
    // Return 404 if file not found instead of falling through
    fallthrough: false,
  })
);


if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}


app.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  res.status(dbStatus === 1 ? 200 : 503).json({
    status: dbStatus === 1 ? 'OK' : 'Degraded',
    database: dbStatusMap[dbStatus] || 'Unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});


app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'College NewsFeed API is running!',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      posts: '/api/posts',
      clubRep: '/api/club-representative',
      uploads: '/uploads',
    },
  });
});


// Order: Most specific routes first
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/club-representative', clubRepresentativeRoutes);


app.use('*', (req: Request, res: Response) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});



app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't expose stack traces in production
  const errorResponse: any = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.url;
  }

  res.status(500).json(errorResponse);
});


const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  try {
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    // Close server (if you have a server variable)
    // server.close(() => {
    //   console.log('✅ HTTP server closed');
    //   process.exit(0);
    // });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});


const server = app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Connecting...'}`);
  console.log(`📁 Uploads: ${path.join(__dirname, '../uploads')}`);
  console.log(`🔒 CORS: ${corsOptions.origin.join(', ')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(70));
});

export default app;
