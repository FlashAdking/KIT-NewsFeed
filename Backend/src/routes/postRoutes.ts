// ============================================================================
// routes/postRoutes.ts - ONLY ADD MULTER, KEEP EVERYTHING ELSE
// ============================================================================
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PostController } from '../controllers/PostController';
import { authenticateToken } from '../middleware/authMiddleware';
import { canCreatePost, canEditPost, canDeletePost, canModeratePost } from '../middleware/postPermissions';
import { allowRoles } from '../middleware/roleMiddleware';

const router = Router();

// ============================================================================
// MULTER SETUP (JUST ADD THIS SECTION)
// ============================================================================
const uploadsDir = path.join(process.cwd(), 'uploads', 'posts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `post_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    ext && mime ? cb(null, true) : cb(new Error('Only images allowed'));
  },
});
// ============================================================================

// ✅ Public routes - NO /:id yet! (UNCHANGED)
router.get('/', PostController.getAllPosts);
router.get('/:id/stats', PostController.getEventStats);

// ✅ Protected routes (UNCHANGED)
router.use(authenticateToken);

// ✅ Specific routes BEFORE /:id wildcard
router.get('/my', PostController.getMyPosts);

// ✅ ONLY CHANGE: Add upload.single('image') middleware
router.post('/', upload.single('image'), canCreatePost, PostController.createPost);
router.put('/:id', upload.single('image'), canEditPost, PostController.updatePost);

// ✅ Rest unchanged
router.delete('/:id', canDeletePost, PostController.deletePost);
router.post('/:id/register', PostController.registerForEvent);
router.get('/:id/registrations', canEditPost, PostController.getEventRegistrations);
router.post('/:id/like', PostController.toggleLike);
router.post('/:id/view', PostController.incrementView);

// Admin routes (UNCHANGED)
router.get('/moderation/pending', allowRoles('admin'), PostController.getPendingPosts);
router.post('/:id/moderate', canModeratePost, PostController.moderatePost);

// ✅ IMPORTANT: Wildcard /:id route LAST (UNCHANGED)
router.get('/:id', PostController.getPostById);

export default router;
