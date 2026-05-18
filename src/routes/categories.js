const express = require("express");
const router = express.Router();

const categoriesController = require("../controllers/categories");
const asyncHandler = require("../middleware/asyncHandler");

// A1 - Перегляд категорій
// GET /api/categories
router.get("/", asyncHandler(categoriesController.getCategories));

module.exports = router;