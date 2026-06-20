import express from 'express';
import * as districtsController from '../controllers/districts.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Роутер для /api/districts
// Надає доступ до довідника районів для побудови UI-фільтрів на фронтенді.
const router = express.Router();

// GET /api/districts
// Публічний ендпоінт — авторизація не потрібна.
// asyncHandler перехоплює помилки з контролера і передає їх у глобальний errorHandler.
router.get('/', asyncHandler(districtsController.getAll));

export default router;
