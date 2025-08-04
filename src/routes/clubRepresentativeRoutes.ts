import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { studentOnly } from '../middleware/roleMiddleware';
import { ClubRepresentativeController } from '../controllers/ClubRepresentativeController';
import { repApplicationValidators } from '../validators/repApplicationValidators';
import { validationResult } from 'express-validator';

const router = Router();

/* ------------------------------------------------------------------ *
 * Shared middleware                                                  *
 * ------------------------------------------------------------------ */
router.use(authenticateToken, studentOnly);

/* ------------------------------------------------------------------ *
 * Helper – surface validation errors                                 *
 * ------------------------------------------------------------------ */
const handleValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
    return;
  }
  next();
};

/* ------------------------------------------------------------------ *
 * New lean application flow                                          *
 * ------------------------------------------------------------------ */
router.post(
  '/apply',
  repApplicationValidators,
  handleValidation,
  ClubRepresentativeController.apply
);
router.get(
  '/applications/:applicationId',
  ClubRepresentativeController.getApplicationDetails
);

/* ------------------------------------------------------------------ *
 * Legacy simple-request routes                                       *
 * ------------------------------------------------------------------ */
router.post('/request', ClubRepresentativeController.requestRepresentation);
router.delete(
  '/request/:membershipId',
  ClubRepresentativeController.cancelRequest
);

/* ------------------------------------------------------------------ *
 * Student dashboards                                                 *
 * ------------------------------------------------------------------ */
router.get('/status', ClubRepresentativeController.getStatus);
router.get('/eligibility', ClubRepresentativeController.checkEligibility);
router.get('/clubs/available', ClubRepresentativeController.getAvailableClubs);
router.get('/club/details', ClubRepresentativeController.getClubDetails);

export default router;
