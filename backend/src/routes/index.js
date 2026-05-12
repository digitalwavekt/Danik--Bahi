import express from 'express';
import multer from 'multer';
import { authenticate, requireRole, requireSocietyAccess } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

import * as authCtrl from '../controllers/auth.controller.js';
import * as usersCtrl from '../controllers/users.controller.js';
import * as societiesCtrl from '../controllers/societies.controller.js';
import * as headingsCtrl from '../controllers/headings.controller.js';
import * as entriesCtrl from '../controllers/entries.controller.js';
import * as reportsCtrl from '../controllers/reports.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images and PDFs are allowed'));
  },
});

router.post('/auth/login', validate(schemas.login), asyncHandler(authCtrl.login));
router.post('/auth/refresh', validate(schemas.refreshToken), asyncHandler(authCtrl.refresh));
router.post('/auth/logout', asyncHandler(authCtrl.logout));
router.post('/auth/logout-all', authenticate, asyncHandler(authCtrl.logoutAll));

router.get('/users', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(usersCtrl.listUsers));
router.post('/users', authenticate, requireRole('super_admin', 'society_admin'), validate(schemas.createUser), asyncHandler(usersCtrl.createUser));
router.patch('/users/:userId/status', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(usersCtrl.toggleUserStatus));
router.delete('/users/:userId', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(usersCtrl.deleteUser));
router.put('/users/:userId/access', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(usersCtrl.updateSocietyAccess));

router.get('/societies', authenticate, asyncHandler(societiesCtrl.listSocieties));
router.post('/societies', authenticate, requireRole('super_admin'), validate(schemas.createSociety), asyncHandler(societiesCtrl.createSociety));
router.get('/societies/:societyId', authenticate, requireSocietyAccess, asyncHandler(societiesCtrl.getSociety));
router.put('/societies/:societyId', authenticate, requireRole('super_admin'), asyncHandler(societiesCtrl.updateSociety));
router.get('/societies/:societyId/balance', authenticate, requireSocietyAccess, asyncHandler(societiesCtrl.getSocietyBalance));

router.get('/societies/:societyId/headings', authenticate, requireSocietyAccess, asyncHandler(headingsCtrl.listHeadings));
router.post('/headings', authenticate, requireRole('super_admin', 'society_admin'), validate(schemas.createHeading), asyncHandler(headingsCtrl.createHeading));
router.patch('/headings/:headingId/toggle', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(headingsCtrl.toggleHeading));
router.delete('/headings/:headingId', authenticate, requireRole('super_admin', 'society_admin'), asyncHandler(headingsCtrl.deleteHeading));

router.get('/societies/:societyId/entries', authenticate, requireSocietyAccess, asyncHandler(entriesCtrl.listEntries));
router.post('/entries', authenticate, requireRole('super_admin', 'society_admin', 'editor'), upload.single('bill'), validate(schemas.createEntry), asyncHandler(entriesCtrl.createEntry));
router.get('/entries/:entryId', authenticate, asyncHandler(entriesCtrl.getEntry));
router.put('/entries/:entryId', authenticate, requireRole('super_admin', 'society_admin', 'editor'), upload.single('bill'), validate(schemas.updateEntry), asyncHandler(entriesCtrl.updateEntry));
router.delete('/entries/:entryId', authenticate, requireRole('super_admin', 'society_admin', 'editor'), asyncHandler(entriesCtrl.deleteEntry));

router.get('/societies/:societyId/reports/summary', authenticate, requireSocietyAccess, asyncHandler(reportsCtrl.getSummaryReport));
router.get('/societies/:societyId/reports/export', authenticate, requireSocietyAccess, asyncHandler(reportsCtrl.exportReport));

export default router;
