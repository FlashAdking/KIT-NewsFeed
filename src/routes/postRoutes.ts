import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { authenticateToken } from '../middleware/authMiddleware';
import { canCreatePost, canEditPost, canDeletePost, canModeratePost } from '../middleware/postPermissions';
import { allowRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public routes
router.get('/', PostController.getAllPosts);
router.get('/:id/stats', PostController.getEventStats);
router.get('/:id', PostController.getPostById);

// Protected routes
router.use(authenticateToken);

router.get('/my', PostController.getMyPosts);
router.post('/:id/register', PostController.registerForEvent);
router.get('/:id/registrations', canEditPost, PostController.getEventRegistrations);

router.post('/', canCreatePost, PostController.createPost);
router.put('/:id', canEditPost, PostController.updatePost);
router.delete('/:id', canDeletePost, PostController.deletePost);

router.post('/:id/like', PostController.toggleLike);
router.post('/:id/view', PostController.incrementView);

// Admin
router.get('/moderation/pending', allowRoles('admin'), PostController.getPendingPosts);
router.post('/:id/moderate', canModeratePost, PostController.moderatePost);

export default router;
