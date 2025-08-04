import { body } from 'express-validator';

export const registerValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .isAlphanumeric()
    .withMessage('Username must be 3-30 characters and contain only letters and numbers'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be either student, faculty, or admin'),

  body('collegeName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('College name is required'),

  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department is required'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),

  // Add faculty-specific validation
  body('employeeId')
    .if(body('role').equals('faculty'))
    .notEmpty()
    .withMessage('Employee ID is required for faculty registration'),

  body('designation')
    .if(body('role').equals('faculty'))
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant'])
    .withMessage('Valid designation is required for faculty')

];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')

];
