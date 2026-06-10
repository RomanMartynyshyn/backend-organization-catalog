import express from 'express';
import { body, param, query } from 'express-validator';
import * as organizationsController from '../controllers/organizations.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../middleware/asyncHandler.js';
import upload from '../middleware/upload.js';
import { createOrganizationValidation } from '../validators/organization/organizationValidators.js';
const router = express.Router();

const geoFields = ['lat', 'lng', 'radiusKm'];

const validateGeoParamsPresence = (value, { req }) => {
  const providedFields = geoFields.filter((field) => req.query[field] !== undefined);

  if (providedFields.length > 0 && providedFields.length < geoFields.length) {
    throw new Error('lat, lng and radiusKm must be provided together');
  }

  return true;
};

router.get('/',
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'archived']).withMessage('status має бути pending, approved, rejected або archived'),
  query('category_id').optional().isInt({ min: 1 }).withMessage('category_id має бути цілим додатним числом'),
  query('lat').custom(validateGeoParamsPresence).bail().optional().isFloat({ min: -90, max: 90 }).withMessage('lat має бути числом в межах від -90 до 90'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng має бути числом в межах від -180 до 180'),
  query('radiusKm').optional().isFloat({ gt: 0 }).withMessage('radiusKm має бути додатним числом'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit має бути цілим додатним числом'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset має бути цілим невід’ємним числом'),
  validate,
  asyncHandler(organizationsController.getOrganisations)
);
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('id має бути цілим числом'), 
  validate,
  asyncHandler(organizationsController.getById)
);

router.post('/', createOrganizationValidation, validate, asyncHandler(organizationsController.create));
router.post('/import', 
  upload.single('file'), 
  validate,
  asyncHandler(organizationsController.importCSV)
);
router.put('/:id/status',
  param('id').isInt({ min: 1 }).withMessage('id має бути цілим числом'),
  body('status').isIn(['approved', 'rejected', 'archived']).withMessage('status має бути approved, rejected або archived'),
  body('rejectionReason').optional({nullable: true}).isString().withMessage('rejectionReason має бути рядком'),
  validate,
  asyncHandler(organizationsController.updateStatus)
);

export default router;
