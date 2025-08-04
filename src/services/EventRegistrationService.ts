import { Post } from '../models/Post';
import { User } from '../models/User';
import { EventRegistration } from '../models/EventRegistration';
import { Types } from 'mongoose';

export class EventRegistrationService {
  
  // Student registers for an event
  static async registerForEvent(userId: string, postId: string, paymentMethod?: string) {
    try {
      // Verify event exists and registration is open
      const post = await Post.findById(postId);
      if (!post || post.postType !== 'event') {
        throw new Error('Event not found');
      }
      
      if (!post.eventDetails?.registrationRequired) {
        throw new Error('This event does not require registration');
      }
      
      // Check registration deadline
      if (post.eventDetails.registrationDeadline && 
          new Date() > post.eventDetails.registrationDeadline) {
        throw new Error('Registration deadline has passed');
      }
      
      // Check if user already registered
      const existingRegistration = await EventRegistration.findOne({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId)
      });
      
      if (existingRegistration) {
        throw new Error('Already registered for this event');
      }
      
      // Check capacity
      const currentRegistrations = await EventRegistration.countDocuments({
        postId: new Types.ObjectId(postId),
        status: { $in: ['registered', 'approved'] }
      });
      
      const maxParticipants = post.eventDetails.maxParticipants || 0;
      let registrationStatus = 'registered';
      
      // Handle capacity limits
      if (maxParticipants > 0 && currentRegistrations >= maxParticipants) {
        if (post.eventDetails.allowWaitlist) {
          registrationStatus = 'waitlisted';
        } else {
          throw new Error('Event is full and waitlist is not available');
        }
      }
      
      // Handle approval requirement
      if (post.eventDetails.requiresApproval && registrationStatus === 'registered') {
        registrationStatus = 'registered'; // Will need approval later
      }
      
      // Determine payment info
      const registrationFee = post.eventDetails.registrationFee || 0;
      const paymentStatus = registrationFee > 0 ? 'pending' : 'paid';
      const method = registrationFee > 0 ? (paymentMethod || 'upi') : 'free';
      
      // Create registration
      const registration = new EventRegistration({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
        status: registrationStatus,
        payment: {
          status: paymentStatus,
          amount: registrationFee,
          method,
          ...(registrationFee === 0 && { paidAt: new Date() })
        },
        registeredAt: new Date()
      });
      
      await registration.save();
      
      // Update post statistics
      await this.updateRegistrationStats(postId);
      
      const populatedRegistration = await EventRegistration.findById(registration._id)
        .populate('userId', 'fullName email username')
        .populate('postId', 'title eventDetails');
      
      console.log(`📝 Event registration: ${(populatedRegistration?.userId as any)?.fullName} → ${(populatedRegistration?.postId as any)?.title}`);
      
      return {
        message: `Successfully ${registrationStatus === 'waitlisted' ? 'added to waitlist' : 'registered'} for event`,
        registration: populatedRegistration,
        requiresPayment: registrationFee > 0,
        paymentAmount: registrationFee
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register for event');
    }
  }
  
  // Get registrations for a specific event (for club representatives)
  static async getEventRegistrations(postId: string, adminUserId: string) {
    try {
      // Verify user can view registrations (handled by middleware)
      const registrations = await EventRegistration.find({ 
        postId: new Types.ObjectId(postId) 
      })
      .populate('userId', 'fullName email username department semester phone')
      .populate('approvedBy', 'fullName email')
      .sort({ registeredAt: -1 });
      
      // Group by status
      const grouped = {
        registered: registrations.filter(r => r.status === 'registered'),
        approved: registrations.filter(r => r.status === 'approved'),
        waitlisted: registrations.filter(r => r.status === 'waitlisted'),
        cancelled: registrations.filter(r => r.status === 'cancelled'),
        rejected: registrations.filter(r => r.status === 'rejected')
      };
      
      // Payment summary
      const paymentSummary = {
        totalRegistrations: registrations.length,
        paidCount: registrations.filter(r => r.payment.status === 'paid').length,
        pendingPayments: registrations.filter(r => r.payment.status === 'pending').length,
        totalRevenue: registrations
          .filter(r => r.payment.status === 'paid')
          .reduce((sum, r) => sum + r.payment.amount, 0)
      };
      
      return {
        registrations: grouped,
        summary: paymentSummary,
        total: registrations.length
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch event registrations');
    }
  }
  
  // Get user's registrations
  static async getUserRegistrations(userId: string) {
    try {
      const registrations = await EventRegistration.find({
        userId: new Types.ObjectId(userId)
      })
      .populate('postId', 'title eventDetails clubId')
      .populate({
        path: 'postId',
        populate: {
          path: 'clubId',
          select: 'clubName clubtype'
        }
      })
      .sort({ registeredAt: -1 });
      
      return {
        registrations,
        total: registrations.length
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user registrations');
    }
  }
  
  // Cancel registration
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
      
      // Check if cancellation is allowed (e.g., before event date)
      const post = await Post.findById(registration.postId);
      if (post?.eventDetails?.eventDate && new Date() > post.eventDetails.eventDate) {
        throw new Error('Cannot cancel registration after event date');
      }
      
      registration.status = 'cancelled';
      await registration.save();
      
      // Update post statistics
      await this.updateRegistrationStats(registration.postId.toString());
      
      // TODO: Handle refund if payment was made
      
      return {
        message: 'Registration cancelled successfully',
        registration
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel registration');
    }
  }
  
  // Update registration statistics in post
  static async updateRegistrationStats(postId: string) {
    try {
      const registrations = await EventRegistration.find({ 
        postId: new Types.ObjectId(postId) 
      });
      
      const stats = {
        totalRegistered: registrations.filter(r => 
          ['registered', 'approved'].includes(r.status)
        ).length,
        totalPaid: registrations.filter(r => r.payment.status === 'paid').length,
        totalRevenue: registrations
          .filter(r => r.payment.status === 'paid')
          .reduce((sum, r) => sum + r.payment.amount, 0),
        waitlistCount: registrations.filter(r => r.status === 'waitlisted').length
      };
      
      await Post.findByIdAndUpdate(postId, { registrationStats: stats });
    } catch (error: any) {
      console.error('Failed to update registration stats:', error);
    }
  }
  
  // Approve/reject registration (for events requiring approval)
  static async processRegistration(
    adminUserId: string,
    registrationId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) {
    try {
      const registration = await EventRegistration.findById(registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }
      
      registration.status = decision;
      registration.approvedBy = new Types.ObjectId(adminUserId);
      registration.approvedAt = new Date();
      registration.notes = notes;
      
      await registration.save();
      
      // Update post statistics
      await this.updateRegistrationStats(registration.postId.toString());
      
      return {
        message: `Registration ${decision} successfully`,
        registration
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process registration');
    }
  }
}
