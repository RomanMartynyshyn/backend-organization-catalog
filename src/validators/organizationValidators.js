// Валідація форми створення організації
const { body } = require("express-validator");

exports.createOrganizationValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("website_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    })
    .withMessage("Website URL must be a valid HTTPS URL"),

  body("category_ids")
    .notEmpty()
    .withMessage("Category IDs are required")
    .isArray({ min: 1, max: 5 })
    .withMessage("Category IDs must be an array with 1 to 5 items")
    .bail(), //зупинка перевірки далі, якщо вже є помилка

  body("category_ids.*")
    .isInt({ min: 1 })
    .withMessage("Each category ID must be a positive integer"),
];
