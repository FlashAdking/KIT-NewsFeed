import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { authenticateToken } from '../middleware/authMiddleware';
import { canCreatePost, canEditPost, canDeletePost, canModeratePost } from '../middleware/postPermissions';
import { allowRoles, clubRepresentativeOnly } from '../middleware/roleMiddleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can view)
router.get('/', PostController.getAllPosts);
router.get('/my', PostController.getMyPosts);
router.get('/:id', PostController.getPostById);

// Protected routes (need specific permissions)
router.post('/', canCreatePost, PostController.createPost);
router.put('/:id', canEditPost, PostController.updatePost);
router.delete('/:id', canDeletePost, PostController.deletePost);

// Admin moderation routes
router.post('/:id/moderate', canModeratePost, PostController.moderatePost);
router.get('/moderation/pending', allowRoles('admin'), PostController.getPendingPosts);

// Engagement routes (all authenticated users)
router.post('/:id/like', PostController.toggleLike);
router.post('/:id/view', PostController.incrementView);

// ✅ UPDATED: Event registration routes with proper middleware
router.post('/:id/register', PostController.registerForEvent);  // Any authenticated user can register

// ✅ FIXED: Only club representatives can view registrations for their events
router.get('/:id/registrations', canEditPost, PostController.getEventRegistrations);

export default router;
