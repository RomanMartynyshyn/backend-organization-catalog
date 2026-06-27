// Валідація форми створення організації
import { body } from "express-validator";

export const createOrganizationValidation = [
  // Перевірка назви організації
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),

  // Перевірка опису
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  // Перевірка URL сайту
  body("websiteUrl")
    .optional({ nullable: true, checkFalsy: true })
    .isURL({
      protocols: ["https"],
      require_protocol: true,
    })
    .withMessage("Website URL must be a valid HTTPS URL"),

  body("contacts")
    .optional({ nullable: true, checkFalsy: true })
    .isObject(),
  body("contacts.email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage("Contact email is not valid"),
  body("contacts.phoneNumbers")
    .optional({ nullable: true, checkFalsy: true })
    .isArray(),
  body("contacts.phoneNumbers.*")
    .isString(),

  body("socialLinks")
    .optional({ nullable: true, checkFalsy: true })
    .isObject(),
  body("socialLinks.facebook")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
  body("socialLinks.instagram")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),

  body("workingHours")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 100 }),

  // Перевірка масиву категорій
  body("categoryIds")
    .notEmpty()
    .withMessage("Category IDs are required")
    .isArray({ min: 1, max: 5 })
    .withMessage("Category IDs must contain from 1 to 5 items")
    .bail(),

  // Перевірка кожного ID категорії
  body("categoryIds.*")
    .isInt({ min: 1 })
    .withMessage("Each category ID must be a positive integer"),

  body("locations")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Locations must be an array with at least one item"),

  body("locations.*.street")
    .trim()
    .isString()
    .isLength({ max: 50 })
    .optional()
    .withMessage("Street is optional for each location"),

  body("locations.*.latitude")
    .trim()
    .notEmpty()
    .withMessage("Latitude is required for each location")
    .isFloat({ min: -90, max: 90 }),

  body("locations.*.longitude")
    .trim()
    .notEmpty()
    .withMessage("Longitude is required for each location")
    .isFloat({ min: -180, max: 180 }),

  // Адміністративна одиниця (район міста або ОТГ).
  // Відповідає таблиці ADMIN_UNITS, яка об'єднує всі типи адміністративних одиниць.
  // city, region та postCode більше не передаються окремо — вони визначаються
  // ієрархією через поле admin_unit_id.
  body("locations.*.adminUnitId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Each admin unit ID must be a positive integer"),

  // Головна локація організації (первинна адреса).
  // Відповідає полю primary_location_id у таблиці ORGANIZATIONS.
  body("primaryLocationId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("primaryLocationId must be a positive integer"),
];
