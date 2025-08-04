import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import { EventRegistrationService } from '../services/EventRegistrationService';

export class PostController {
  
  // Create new post
  static async createPost(req: Request, res: Response) {
    try {
      const userId = req.user._id.toString();
      const postData = req.body;
      
      // Validate required fields
      if (!postData.title || !postData.content || !postData.categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and categoryId are required'
        });
      }
      
      const result = await PostService.createPost(userId, postData);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get all posts with filters
  static async getAllPosts(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as string,
        authorType: req.query.authorType as string,
        categoryId: req.query.categoryId as string,
        clubId: req.query.clubId as string,
        postType: req.query.postType as string,
        priority: req.query.priority as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };
      
      const result = await PostService.getAllPosts(filters);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get single post by ID
  static async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?._id?.toString();
      
      const result = await PostService.getPostById(id, userId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Update post
  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const updateData = req.body;
      
      const result = await PostService.updatePost(id, userId, updateData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Delete post
  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      
      const result = await PostService.deletePost(id, userId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Toggle like on post
  static async toggleLike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      
      const result = await PostService.toggleLike(id, userId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get posts by current user
  static async getMyPosts(req: Request, res: Response) {
    try {
      const userId = req.user._id.toString();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await PostService.getPostsByUser(userId, page, limit);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Increment view count
  static async incrementView(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Just call getPostById without returning the full post data
      await PostService.getPostById(id, req.user?._id?.toString());
      
      res.status(200).json({
        success: true,
        message: 'View recorded'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get posts for admin moderation
  static async getPendingPosts(req: Request, res: Response) {
    try {
      const filters = {
        status: 'pending',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };
      
      const result = await PostService.getAllPosts(filters);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ FIXED: Get event registrations (for club representatives)
  static async getEventRegistrations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      
      const result = await EventRegistrationService.getEventRegistrations(id, userId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ FIXED: Register for event
  static async registerForEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const { paymentMethod } = req.body;
      
      const result = await EventRegistrationService.registerForEvent(id, userId, paymentMethod);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ REMOVED: Duplicate getRegistrations method (was calling non-existent getParticipants)

  // Moderate post (admin only)
  static async moderatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body; // action: 'approve' | 'reject'
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be approve or reject'
        });
      }
      
      // Use PostService updatePost with admin permissions
      const status = action === 'approve' ? 'published' : 'rejected';
      const updateData = {
        status,
        moderatedBy: req.user._id,
        ...(notes && { moderationNotes: notes })
      };
      
      const result = await PostService.updatePost(id, req.user._id.toString(), updateData);
      
      res.status(200).json({
        success: true,
        message: `Post ${action}d successfully`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

} // ✅ FIXED: Closing brace for class
