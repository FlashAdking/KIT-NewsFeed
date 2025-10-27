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

// // ✅ NEW: Enhanced club representative management
// router.get('/applications/:applicationId/details', AdminController.getApplicationDetails);

// Changed from /applications/:applicationId/details to:
router.get('/representatives/:membershipId/details', AdminController.getApplicationDetails);



// ✅ UPDATED: Keep existing route but now enhanced
// router.post('/representatives/:membershipId/process', AdminController.processRepresentativeRequest);


// new admin management routes

// Get all regular users (for promotion selection)
router.get('/users', AdminController.getAllUsers);

// Get all admins (for admin management page)
router.get('/admins', AdminController.getAllAdmins);

// Promote user to admin (post moderator)
router.post('/promote', AdminController.promoteToAdmin);

// Revoke admin access
router.post('/revoke', AdminController.revokeAdmin);

// Grant additional permissions (if needed later)
router.post('/permissions/grant', AdminController.grantPermissions);


export default router;
