import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/roleMiddleware';

const router = Router();

// Apply authentication and admin-only middleware to all routes
router.use(authenticateToken);
router.use(adminOnly);

// Faculty Management Routes


// Club Representative Management Routes
router.get('/representatives/pending', AdminController.getPendingRepresentatives);
router.post('/representatives/:membershipId/process', AdminController.processRepresentativeRequest);
router.get('/representatives/history', AdminController.getRepresentativeHistory);

// Club Membership Management Routes
router.get('/memberships/pending', AdminController.getPendingMemberships);
router.post('/memberships/:membershipId/process', AdminController.approveMembership);

// User Management Routes
router.post('/promote', AdminController.promoteToAdmin);
router.post('/permissions/grant', AdminController.grantPermissions);

// Add these new routes to your existing admin routes:

// ✅ NEW: Enhanced club representative management
router.get('/applications/:applicationId/details', AdminController.getApplicationDetails);

// ✅ UPDATED: Keep existing route but now enhanced
router.post('/representatives/:membershipId/process', AdminController.processRepresentativeRequest);


export default router;
