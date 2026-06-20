import express from 'express';
import * as districtsController from '../controllers/districts.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(districtsController.getAll));

export default router;
