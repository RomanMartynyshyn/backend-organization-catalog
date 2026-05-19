import { Router } from 'express';
import multer from 'multer';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  importOrganizations,
  updateOrganizationStatus,
} from '../controllers/organizations.js';
import { validate } from '../middleware/validate.js';
 
const router = Router();
 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed'));
    }
  },
});
 
// A1 - Перегляд каталогу
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
 
// A2 - Додавання організації
router.post('/', validate, createOrganization);
router.post('/import', upload.single('file'), importOrganizations);
 
// A3 - Модерація
router.put('/:id/status', validate, updateOrganizationStatus);
 
export default router;