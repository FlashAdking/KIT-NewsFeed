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



// Load environment variables
dotenv.config();

// Connect to MongoDB before starting the server
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'College NewsFeed API is running!',
    database: 'Connected to MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});


// Admin routess
// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/club-representative', clubRepresentativeRoutes);
app.use('/api/posts', postRoutes);


app.use('/api/auth', authRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    database: 'Connected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});



// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});

export default app;
