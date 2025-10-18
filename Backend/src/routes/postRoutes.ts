import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { authenticateToken } from '../middleware/authMiddleware';
import { canCreatePost, canEditPost, canDeletePost, canModeratePost } from '../middleware/postPermissions';
import { allowRoles } from '../middleware/roleMiddleware';

const router = Router();

// ✅ Public routes - NO /:id yet!
router.get('/', PostController.getAllPosts);
router.get('/:id/stats', PostController.getEventStats); // Specific before wildcard

// ✅ Protected routes
router.use(authenticateToken);

// ✅ Specific routes BEFORE /:id wildcard
router.get('/my', PostController.getMyPosts);
router.post('/', canCreatePost, PostController.createPost);
router.put('/:id', canEditPost, PostController.updatePost);
router.delete('/:id', canDeletePost, PostController.deletePost);

router.post('/:id/register', PostController.registerForEvent);
router.get('/:id/registrations', canEditPost, PostController.getEventRegistrations);
router.post('/:id/like', PostController.toggleLike);
router.post('/:id/view', PostController.incrementView);

// Admin routes
router.get('/moderation/pending', allowRoles('admin'), PostController.getPendingPosts);
router.post('/:id/moderate', canModeratePost, PostController.moderatePost);

// ✅ IMPORTANT: Wildcard /:id route LAST
router.get('/:id', PostController.getPostById);

export default router;
