import express from 'express';
import * as categoriesController from '../controllers/categories.js';
import asyncHandler from '../middleware/asyncHandler.js';
const router = express.Router();

router.get('/', asyncHandler(categoriesController.getAllCategories));

export default router;