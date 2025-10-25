// ============================================================================
// services/EventRegistrationService.ts - SIMPLIFIED FOR YOUR SCHEMA
// ============================================================================
import { Post } from '../models/Post';
import { User } from '../models/User';
import { EventRegistration } from '../models/EventRegistration';
import { Types } from 'mongoose';

export class EventRegistrationService {
  
  // ========================================================================
  // STUDENT REGISTERS FOR EVENT
  // ========================================================================
  static async registerForEvent(userId: string, postId: string, paymentMethod?: string) {
    try {
      // Verify event exists
      const post = await Post.findById(postId);
      if (!post || post.postType !== 'event') {
        throw new Error('Event not found');
      }
      
      // Check if event date exists
      if (!post.eventDetails?.eventDate) {
        throw new Error('Invalid event details');
      }
      
      // Check if event has already passed
      if (new Date() > post.eventDetails.eventDate) {
        throw new Error('This event has already passed');
      }
      
      // Check if user already registered
      const existingRegistration = await EventRegistration.findOne({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        status: { $ne: 'cancelled' } // Exclude cancelled registrations
      });
      
      if (existingRegistration) {
        throw new Error('You are already registered for this event');
      }
      
      // Check capacity (if maxParticipants is set)
      const maxParticipants = post.eventDetails.maxParticipants;
      let registrationStatus: 'registered' | 'waitlisted' = 'registered';
      
      if (maxParticipants && maxParticipants > 0) {
        const currentRegistrations = await EventRegistration.countDocuments({
          postId: new Types.ObjectId(postId),
          status: 'registered'
        });
        
        if (currentRegistrations >= maxParticipants) {
          // Event is full - no waitlist in simplified version
          throw new Error('Event is full. Registration closed.');
        }
      }
      
      // Create registration (simplified - no payment for now)
      const registration = new EventRegistration({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        status: registrationStatus,
        registeredAt: new Date()
      });
      
      await registration.save();
      
      // Populate user and post details
      const populatedRegistration = await EventRegistration.findById(registration._id)
        .populate('userId', 'fullName email username')
        .populate('postId', 'title eventDetails');
      
      console.log(`✅ Registration: ${(populatedRegistration?.userId as any)?.fullName} → ${(populatedRegistration?.postId as any)?.title}`);
      
      return {
        success: true,
        message: 'Successfully registered for event',
        registration: populatedRegistration
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register for event');
    }
  }
  
  // ========================================================================
  // GET EVENT REGISTRATIONS (for event creators/admins)
  // ========================================================================
  static async getEventRegistrations(postId: string, requestingUserId: string) {
    try {
      // Verify post exists and user has permission (handled by middleware)
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Event not found');
      }
      
      // Get all registrations
      const registrations = await EventRegistration.find({ 
        postId: new Types.ObjectId(postId),
        status: { $ne: 'cancelled' } // Exclude cancelled
      })
      .populate('userId', 'fullName email username department semester phone')
      .sort({ registeredAt: -1 });
      
      // Group by status
      const grouped = {
        registered: registrations.filter(r => r.status === 'registered'),
        waitlisted: registrations.filter(r => r.status === 'waitlisted'),
        cancelled: registrations.filter(r => r.status === 'cancelled'),
      };
      
      // Summary stats
      const summary = {
        totalRegistrations: registrations.length,
        maxParticipants: post.eventDetails?.maxParticipants || null,
        spotsRemaining: post.eventDetails?.maxParticipants 
          ? Math.max(0, post.eventDetails.maxParticipants - registrations.length)
          : null,
        registeredCount: grouped.registered.length,
        waitlistedCount: grouped.waitlisted.length,
      };
      
      return {
        success: true,
        registrations: grouped,
        summary,
        total: registrations.length
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch event registrations');
    }
  }
  
  // ========================================================================
  // GET USER'S REGISTRATIONS
  // ========================================================================
  static async getUserRegistrations(userId: string) {
    try {
      const registrations = await EventRegistration.find({
        userId: new Types.ObjectId(userId)
      })
      .populate({
        path: 'postId',
        select: 'title imageUrl eventDetails postType',
        populate: {
          path: 'clubId',
          select: 'clubName clubtype'
        }
      })
      .sort({ registeredAt: -1 });
      
      // Separate into upcoming and past events
      const now = new Date();
      const upcoming = registrations.filter(r => {
        const post = r.postId as any;
        return post?.eventDetails?.eventDate && new Date(post.eventDetails.eventDate) > now;
      });
      
      const past = registrations.filter(r => {
        const post = r.postId as any;
        return post?.eventDetails?.eventDate && new Date(post.eventDetails.eventDate) <= now;
      });
      
      return {
        success: true,
        registrations: {
          upcoming,
          past,
          all: registrations
        },
        total: registrations.length
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch your registrations');
    }
  }
  
  // ========================================================================
  // CANCEL REGISTRATION
  // ========================================================================
  static async cancelRegistration(userId: string, registrationId: string) {
    try {
      const registration = await EventRegistration.findOne({
        _id: registrationId,
        userId: new Types.ObjectId(userId)
      });
      
      if (!registration) {
        throw new Error('Registration not found');
      }
      
      if (registration.status === 'cancelled') {
        throw new Error('Registration already cancelled');
      }
      
      // Check if event has already started
      const post = await Post.findById(registration.postId);
      if (post?.eventDetails?.eventDate) {
        const eventDate = new Date(post.eventDetails.eventDate);
        const now = new Date();
        
        // Don't allow cancellation if event started
        if (now > eventDate) {
          throw new Error('Cannot cancel registration for past events');
        }
        
        // Optional: Don't allow cancellation within 24 hours of event
        const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilEvent < 24) {
          throw new Error('Cannot cancel registration within 24 hours of event start');
        }
      }
      
      registration.status = 'cancelled';
      await registration.save();
      
      console.log(`❌ Registration cancelled: ${userId} for event ${registration.postId}`);
      
      return {
        success: true,
        message: 'Registration cancelled successfully',
        registration
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel registration');
    }
  }
  
  // ========================================================================
  // CHECK REGISTRATION STATUS
  // ========================================================================
  static async checkRegistrationStatus(userId: string, postId: string) {
    try {
      const registration = await EventRegistration.findOne({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        status: { $ne: 'cancelled' }
      });
      
      return {
        success: true,
        isRegistered: !!registration,
        registration: registration || null,
        status: registration?.status || null
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to check registration status');
    }
  }
  
  // ========================================================================
  // GET EVENT STATS (public)
  // ========================================================================
  static async getEventStats(postId: string) {
    try {
      const post = await Post.findById(postId);
      if (!post || post.postType !== 'event') {
        throw new Error('Event not found');
      }
      
      const registrations = await EventRegistration.countDocuments({
        postId: new Types.ObjectId(postId),
        status: 'registered'
      });
      
      const maxParticipants = post.eventDetails?.maxParticipants;
      
      return {
        success: true,
        stats: {
          totalRegistrations: registrations,
          maxParticipants: maxParticipants || null,
          spotsRemaining: maxParticipants ? Math.max(0, maxParticipants - registrations) : null,
          isFull: maxParticipants ? registrations >= maxParticipants : false
        }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch event stats');
    }
  }
  
  // ========================================================================
  // DELETE REGISTRATION (admin only)
  // ========================================================================
  static async deleteRegistration(registrationId: string, adminUserId: string) {
    try {
      const registration = await EventRegistration.findById(registrationId);
      
      if (!registration) {
        throw new Error('Registration not found');
      }
      
      await registration.deleteOne();
      
      console.log(`🗑️ Registration deleted by admin ${adminUserId}`);
      
      return {
        success: true,
        message: 'Registration deleted successfully'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete registration');
    }
  }
}
