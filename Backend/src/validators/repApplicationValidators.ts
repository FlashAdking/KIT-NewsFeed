import { body, oneOf } from 'express-validator';

export const repApplicationValidators = [
  // ✅ FIXED: Remove the custom message parameter
  oneOf([
    /* ➊ Existing club path */
    body('clubId').isMongoId(),
    
    /* ➋ New club path */
    [
      body('clubName')
        .notEmpty()
        .withMessage('clubName is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('clubName must be 3-100 characters'),
      
      body('clubType')
        .notEmpty()
        .withMessage('clubType is required')
        .isIn(['academic', 'cultural', 'sports', 'technical', 'social'])
        .withMessage('clubType must be academic, cultural, sports, technical or social')
    ]
  ]),

  /* Optional department for new clubs */
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('department name too long'),

  /* Representative-specific fields (always required) */
  body('clubPosition')
    .trim()
    .notEmpty()
    .withMessage('clubPosition is required')
    .isIn(['president', 'vice-president', 'secretary', 'coordinator', 'treasurer'])
    .withMessage('clubPosition must be president, vice-president, secretary, coordinator, or treasurer'),

  body('officialEmail')
    .trim()
    .notEmpty()
    .withMessage('officialEmail is required')
    .isEmail()
    .withMessage('officialEmail must be a valid email address'),

  body('officialPhone')
    .trim()
    .notEmpty()
    .withMessage('officialPhone is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('officialPhone must be 10-15 digits'),

  body('statement')
    .trim()
    .notEmpty()
    .withMessage('statement is required')
    .isLength({ min: 50, max: 2000 })
    .withMessage('statement must be between 50 and 2000 characters'),

  body('supportingDocUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('supportingDocUrl must be a valid URL')
];
