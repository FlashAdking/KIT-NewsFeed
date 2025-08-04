import { body, oneOf } from 'express-validator';

/*
 * A valid request must satisfy ONE of these alternatives:
 *   ➊ Existing-club path  →  `clubId`
 *   ➋ New-club   path     →  `clubName` + `clubType`
 */
export const repApplicationValidators = [
  oneOf([
    /* ➊ Existing club: just ensure clubId is a Mongo ObjectId */
    body('clubId').isMongoId(),
    
    /* ➋ New club: require clubName (≥3 chars) and a valid clubType */
    body('clubName')
      .isLength({ min: 3 })
      .withMessage('clubName is required (≥3 characters)')
      .custom((value, { req }) => {
        // Only validate clubName if clubId is not provided
        if (!req.body.clubId && !value) {
          throw new Error('clubName is required for new clubs');
        }
        return true;
      })
  ]),

  /* Always require clubType if clubName is provided (new club) */
  body('clubType')
    .if(body('clubName').exists())
    .isIn(['academic', 'cultural', 'sports', 'technical', 'social'])
    .withMessage('clubType must be academic, cultural, sports, technical or social'),

  /* Representative-specific fields (always required) */
  body('clubPosition')
    .isIn(['president', 'vice-president', 'secretary', 'coordinator', 'treasurer'])
    .withMessage('clubPosition is invalid'),

  body('officialEmail')
    .isEmail()
    .withMessage('officialEmail must be a valid email address'),

  body('officialPhone')
    .notEmpty()
    .isLength({ min: 10, max: 15 })
    .withMessage('officialPhone must be 10-15 digits'),

  body('statement')
    .isLength({ min: 20, max: 300 })
    .withMessage('statement must be between 20 and 300 characters'),

  body('supportingDocUrl')
    .optional()
    .isURL()
    .withMessage('supportingDocUrl must be a valid URL')
];
