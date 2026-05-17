const express = require('express');
const router = express.Router();
// TODO: Імпортувати контролери

// A1 - Перегляд каталогу
// GET /api/organizations?category_id=...
// GET /api/organizations/:id

// A2 - Додавання організації
// POST /api/organizations
// POST /api/organizations/import

// A3 - Модерація організацій
// GET /api/organizations?status=pending
// PUT /api/organizations/:id/state

module.exports = router;
