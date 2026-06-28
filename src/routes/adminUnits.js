import express from 'express';
import { query } from 'express-validator';
import * as adminUnitsController from '../controllers/adminUnits.js';
import asyncHandler from '../middleware/asyncHandler.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.get('/',
    query('type').optional().isString().withMessage('type має бути рядком'),
    query('parentId').optional().isInt({ min: 0 }).withMessage('parentId має бути цілим невід’ємним числом'),
    validate,
    asyncHandler(adminUnitsController.getAdminUnits)
);

export default router;