import { Post } from '../models/Post';
import { User } from '../models/User';
import { Club } from '../models/Club';
import { Category } from '../models/Category';
import { Types } from 'mongoose';
import { IPost } from '../models/interfaces/IPost';

export class PostService {

  // Create new post
  static async createPost(
    userId: string,
    postData: {
      title: string;
      content: string;
      categoryId: string;
      postType: 'announcement' | 'event' | 'news' | 'general';
      priority?: 'low' | 'medium' | 'high';
      media?: any[];
      eventDetails?: any;
      registrationLink?: string;
      scheduledFor?: Date;
    }
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Determine author type and club ID
      let authorType: 'faculty' | 'club';
      let clubId: Types.ObjectId | undefined;

      if (user.role === 'student') {
        if (!user.clubRepresentative?.isActive) {
          throw new Error('Club representative status required to create posts');
        }
        authorType = 'club';
        clubId = user.clubRepresentative.clubId;
      } else if (user.role === 'admin') {
        // Admin can create posts as faculty type
        authorType = 'faculty';
      } else {
        throw new Error('Invalid user role for post creation');
      }

      // Verify category exists
      const category = await Category.findById(postData.categoryId);
      if (!category || !category.isActive) {
        throw new Error('Invalid or inactive category');
      }

      // Create post
      const post = new Post({
        title: postData.title,
        content: postData.content,
        createdBy: new Types.ObjectId(userId),
        authorType,
        clubId,
        categoryId: new Types.ObjectId(postData.categoryId),
        postType: postData.postType,
        priority: postData.priority || 'medium',
        media: postData.media || [],
        eventDetails: postData.eventDetails,
        registrationLink: postData.registrationLink,
        status: 'pending', // All posts start as pending
        scheduledFor: postData.scheduledFor,
        publishedAt: new Date()
      });

      await post.save();

      // Populate the post with related data
      const populatedPost = await Post.findById(post._id)
        .populate('createdBy', 'fullName email username')
        .populate('clubId', 'clubName clubtype')
        .populate('categoryId', 'name slug');

      console.log(`📝 Post created: "${post.title}" by ${user.fullName} (${authorType})`);

      return {
        message: 'Post created successfully',
        post: populatedPost
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create post');
    }
  }

  // Get all posts with filters
  static async getAllPosts(
    filters: {
      status?: string;
      authorType?: string;
      categoryId?: string;
      clubId?: string;
      postType?: string;
      priority?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const {
        status,
        authorType,
        categoryId,
        clubId,
        postType,
        priority,
        page = 1,
        limit = 10
      } = filters;

      // Build query - only add fields that have values
      const query: any = {};

      // Only add to query if value exists and is not 'undefined' string
      if (status && status !== 'undefined') {
        query.status = status;
      } else {
        query.status = 'published'; // Default
      }

      if (authorType && authorType !== 'undefined') query.authorType = authorType;
      if (categoryId && categoryId !== 'undefined') query.categoryId = new Types.ObjectId(categoryId);
      if (clubId && clubId !== 'undefined') query.clubId = new Types.ObjectId(clubId);
      if (postType && postType !== 'undefined') query.postType = postType;
      if (priority && priority !== 'undefined') query.priority = priority;

      console.log('🔍 MongoDB query:', JSON.stringify(query));

      const skip = (page - 1) * limit;

      const posts = await Post.find(query)
        .populate('createdBy', 'fullName email username')
        .populate('clubId', 'clubName clubtype department')
        .populate('categoryId', 'name slug')
        .sort({ isPinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments(query);

      console.log(`✅ Found ${posts.length} posts out of ${total} total`);

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      console.error('❌ PostService.getAllPosts error:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  // Get single post by ID
  static async getPostById(postId: string, userId?: string) {
    try {
      const post = await Post.findById(postId)
        .populate('createdBy', 'fullName email username profilePicture')
        .populate('clubId', 'clubName clubtype department logo')
        .populate('categoryId', 'name slug description');

      if (!post) {
        throw new Error('Post not found');
      }

      // Increment view count if user is viewing
      if (userId) {
        await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
        post.views += 1;
      }

      return post;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch post');
    }
  }

  // ✅ FIXED: Update post
  static async updatePost(
    postId: string,
    userId: string,
    updateData: Partial<IPost>
  ) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // ✅ FIXED: Check permissions with optional chaining
      if (user.role === 'student' && user.clubRepresentative?.isActive) {
        const userClubId = user.clubRepresentative?.clubId?.toString();
        const postClubId = post.clubId?.toString();
        
        if (!userClubId || postClubId !== userClubId) {
          throw new Error('Can only edit your club\'s posts');
        }
      } else if (user.role !== 'admin') {
        throw new Error('Insufficient permissions');
      }

      // Update allowed fields
      const allowedFields = [
        'title', 'content', 'categoryId', 'postType', 'priority',
        'media', 'eventDetails', 'registrationLink', 'scheduledFor'
      ];

      const filteredData: any = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key as keyof IPost];
        }
      });

      // Reset to pending if content changed
      if (updateData.title || updateData.content) {
        filteredData.status = 'pending';
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        filteredData,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'fullName email username')
        .populate('clubId', 'clubName clubtype')
        .populate('categoryId', 'name slug');

      console.log(`✏️ Post updated: "${updatedPost?.title}" by ${user.fullName}`);

      return {
        message: 'Post updated successfully',
        post: updatedPost
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update post');
    }
  }

  // ✅ FIXED: Delete post
  static async deletePost(postId: string, userId: string) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // ✅ FIXED: Check permissions with optional chaining
      if (user.role === 'student' && user.clubRepresentative?.isActive) {
        const userClubId = user.clubRepresentative?.clubId?.toString();
        const postClubId = post.clubId?.toString();
        
        if (!userClubId || postClubId !== userClubId) {
          throw new Error('Can only delete your club\'s posts');
        }
      } else if (user.role !== 'admin') {
        throw new Error('Insufficient permissions');
      }

      await Post.findByIdAndDelete(postId);

      console.log(`🗑️ Post deleted: "${post.title}" by ${user.fullName}`);

      return {
        message: 'Post deleted successfully'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete post');
    }
  }

  // Toggle like on post
  static async toggleLike(postId: string, userId: string) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const userObjectId = new Types.ObjectId(userId);
      const isLiked = post.likes.includes(userObjectId);

      if (isLiked) {
        // Remove like
        post.likes = post.likes.filter(id => !id.equals(userObjectId));
      } else {
        // Add like
        post.likes.push(userObjectId);
      }

      await post.save();

      return {
        message: isLiked ? 'Post unliked' : 'Post liked',
        liked: !isLiked,
        likesCount: post.likes.length
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle like');
    }
  }

  // Get posts by user
  static async getPostsByUser(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const posts = await Post.find({ createdBy: new Types.ObjectId(userId) })
        .populate('clubId', 'clubName clubtype')
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments({ createdBy: new Types.ObjectId(userId) });

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user posts');
    }
  }
}
