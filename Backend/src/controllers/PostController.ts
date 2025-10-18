import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import { EventRegistrationService } from '../services/EventRegistrationService';
import { Post } from '../models/Post';
import { EventRegistration } from '../models/EventRegistration';

export class PostController {
  
  // ✅ Helper to extract user ID from JWT token
  private static getUserId(req: Request): string {
    const userId = (req.user as any)?.userId?.toString() 
                || (req.user as any)?._id?.toString() 
                || (req.user as any)?.sub?.toString();
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    
    return userId;
  }

  static async getEventStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await Post.findById(id)
        .select('_id postType status eventDetails.maxParticipants')
        .lean();

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      if (post.postType !== 'event') {
        return res.status(400).json({ success: false, message: 'Stats available only for events' });
      }

      const totalRegistered = await EventRegistration.countDocuments({
        postId: id,
        status: 'registered',
      });

      const maxParticipants = (post as any).eventDetails?.maxParticipants ?? null;
      const spotsRemaining =
        typeof maxParticipants === 'number'
          ? Math.max(0, maxParticipants - totalRegistered)
          : null;

      return res.json({
        success: true,
        data: {
          eventId: id,
          totalRegistered,
          maxParticipants,
          spotsRemaining,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to load stats' });
    }
  }

  static async createPost(req: Request, res: Response) {
    try {
      const userId = PostController.getUserId(req);
      const postData = req.body;

      if (!postData.title || !postData.content || !postData.categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and categoryId are required',
        });
      }

      const result = await PostService.createPost(userId, postData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllPosts(req: Request, res: Response) {
    try {
      const filters: any = {};

      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.authorType) filters.authorType = req.query.authorType as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.clubId) filters.clubId = req.query.clubId as string;
      if (req.query.postType) filters.postType = req.query.postType as string;
      if (req.query.priority) filters.priority = req.query.priority as string;

      filters.page = parseInt(req.query.page as string) || 1;
      filters.limit = parseInt(req.query.limit as string) || 10;

      console.log('📊 Controller filters:', JSON.stringify(filters));

      const result = await PostService.getAllPosts(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ PostController.getAllPosts error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch posts',
      });
    }
  }

  static async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user ? PostController.getUserId(req) : undefined;

      const result = await PostService.getPostById(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);
      const updateData = req.body;

      const result = await PostService.updatePost(id, userId, updateData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);

      const result = await PostService.deletePost(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async toggleLike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);

      const result = await PostService.toggleLike(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getMyPosts(req: Request, res: Response) {
    try {
      console.log('📝 getMyPosts called');
      
      const userId = PostController.getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      console.log(`✅ Fetching posts for user: ${userId}`);

      const result = await PostService.getPostsByUser(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ getMyPosts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch your posts',
      });
    }
  }

  static async incrementView(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user ? PostController.getUserId(req) : undefined;
      
      await PostService.getPostById(id, userId);

      res.status(200).json({
        success: true,
        message: 'View recorded',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getPendingPosts(req: Request, res: Response) {
    try {
      const filters = {
        status: 'pending',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await PostService.getAllPosts(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getEventRegistrations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);

      const result = await EventRegistrationService.getEventRegistrations(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async registerForEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);
      const { paymentMethod } = req.body;

      const result = await EventRegistrationService.registerForEvent(id, userId, paymentMethod);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ FIXED: Moderate post
  static async moderatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const adminId = PostController.getUserId(req);

      console.log('✅ Moderating post:', { adminId, postId: id, action });

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be approve or reject',
        });
      }

      const status = action === 'approve' ? 'published' : 'rejected';
      const updateData: any = {
        status,
        moderatedBy: adminId,
        moderationNotes: notes || ''
      };

      const result = await PostService.updatePost(id, adminId, updateData);

      res.status(200).json({
        success: true,
        message: `Post ${action}d successfully`,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Moderate post error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
