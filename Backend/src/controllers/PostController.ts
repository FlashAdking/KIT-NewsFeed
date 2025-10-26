// ============================================================================
// controllers/PostController.ts - UPDATED FOR IMAGE UPLOAD + EXISTING WORKFLOW
// ============================================================================
import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import { EventRegistrationService } from '../services/EventRegistrationService';
import { Post } from '../models/Post';
import { EventRegistration } from '../models/EventRegistration';

export class PostController {

  // ========================================================================
  // HELPER: Extract user ID from JWT token
  // ========================================================================
  private static getUserId(req: Request): string {
    const userId = (req.user as any)?.userId?.toString()
      || (req.user as any)?._id?.toString()
      || (req.user as any)?.sub?.toString();

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    return userId;
  }

  // ========================================================================
  // CREATE POST (WITH IMAGE UPLOAD)
  // ========================================================================
  static async createPost(req: Request, res: Response) {
    try {
      const userId = PostController.getUserId(req);
      const postData = req.body;

      console.log('[CREATE POST] Body:', postData);
      console.log('[CREATE POST] File:', req.file);

      // ✅ ADD IMAGE URL if uploaded
      if (req.file) {
        postData.imageUrl = `/uploads/posts/${req.file.filename}`;
      }

      // Validation
      if (!postData.title || !postData.content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required',
        });
      }

      // Parse eventDetails if string (from FormData)
      if (typeof postData.eventDetails === 'string') {
        try {
          postData.eventDetails = JSON.parse(postData.eventDetails);
        } catch (e) {
          console.error('Failed to parse eventDetails:', e);
        }
      }

      // Call your existing PostService
      const result = await PostService.createPost(userId, postData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[CREATE POST] Error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================================================
  // GET ALL POSTS
  // ========================================================================
  static async getAllPosts(req: Request, res: Response) {
    try {
      const filters: any = {};

      // Apply filters from query params
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.authorType) filters.authorType = req.query.authorType as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.clubId) filters.clubId = req.query.clubId as string;
      if (req.query.postType) filters.postType = req.query.postType as string;
      if (req.query.priority) filters.priority = req.query.priority as string;

      filters.page = parseInt(req.query.page as string) || 1;
      filters.limit = parseInt(req.query.limit as string) || 10;

      console.log('📊 getAllPosts filters:', JSON.stringify(filters));

      const result = await PostService.getAllPosts(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ getAllPosts error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch posts',
      });
    }
  }

  // ========================================================================
  // GET POST BY ID
  // ========================================================================
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

  // ========================================================================
  // UPDATE POST (WITH IMAGE UPLOAD)
  // ========================================================================
  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);
      const updateData = req.body;

      console.log('[UPDATE POST] Body:', updateData);
      console.log('[UPDATE POST] File:', req.file);

      // ✅ ADD IMAGE URL if new file uploaded
      if (req.file) {
        updateData.imageUrl = `/uploads/posts/${req.file.filename}`;
      }

      // Parse eventDetails if string (from FormData)
      if (typeof updateData.eventDetails === 'string') {
        try {
          updateData.eventDetails = JSON.parse(updateData.eventDetails);
        } catch (e) {
          console.error('Failed to parse eventDetails:', e);
        }
      }

      const result = await PostService.updatePost(id, userId, updateData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[UPDATE POST] Error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================================================
  // DELETE POST
  // ========================================================================
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

  // ========================================================================
  // GET MY POSTS
  // ========================================================================
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

  // ========================================================================
  // TOGGLE LIKE
  // ========================================================================
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

  // ========================================================================
  // INCREMENT VIEW
  // ========================================================================
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

  // ========================================================================
  // GET PENDING POSTS (ADMIN)
  // ========================================================================
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

  // ========================================================================
  // MODERATE POST (ADMIN - APPROVE/REJECT)
  // ========================================================================
  static async moderatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const adminId = PostController.getUserId(req);

      console.log('✅ [moderatePost] Starting:', {
        adminId,
        postId: id,
        action,
        user: req.user
      });

      if (!['approve', 'reject'].includes(action)) {
        console.log('❌ [moderatePost] Invalid action:', action);
        return res.status(400).json({
          success: false,
          message: 'Action must be "approve" or "reject"',
        });
      }

      const status = action === 'approve' ? 'published' : 'rejected';
      const updateData: any = {
        status,
        moderatedBy: adminId,
        moderationNotes: notes || ''
      };

      if (action === 'approve') {
        updateData.publishedAt = new Date();
      }

      console.log('✅ [moderatePost] Update data:', updateData);

      const result = await PostService.updatePost(id, adminId, updateData);

      console.log('✅ [moderatePost] Success:', result);

      res.status(200).json({
        success: true,
        message: `Post ${action}d successfully`,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ [moderatePost] Error:', error.message);
      console.error('❌ [moderatePost] Stack:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  // ========================================================================
  // EVENT: GET STATS
  // ========================================================================
  static async getEventStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const post = await Post.findById(id)
        .select('_id postType status eventDetails.maxParticipants')
        .lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (post.postType !== 'event') {
        return res.status(400).json({
          success: false,
          message: 'Stats available only for events'
        });
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
      console.error('[GET EVENT STATS] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to load stats'
      });
    }
  }

  // ========================================================================
  // EVENT: GET REGISTRATIONS (for event creator/admin)
  // ========================================================================
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

  // ========================================================================
  // EVENT: REGISTER FOR EVENT
  // ========================================================================
  static async registerForEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = PostController.getUserId(req);

      const result = await EventRegistrationService.registerForEvent(userId, id);

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
}
