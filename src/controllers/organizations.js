// Логіка контролера для роботи з організаціями
const { pool } = require("../db"); // підключення пулу MySQL (з'єднання з БД)

// Створення заявки на додавання організації
// контролер POST запиту (створення заявки)
exports.createOrganization = async (req, res) => {
  const { name, description, website_url, category_ids } = req.body; //отримання даних з body (форми заявки)

  // додаткова перевірка category_ids для захисту від null/undefined і невалідних значень до виконання SQL-запитів, щоб уникнути помилок на рівні бази даних
  if (!Array.isArray(category_ids) || category_ids.length === 0) {
    const error = new Error("category_ids must be a non-empty array");
    error.status = 400;
    error.field = "category_ids";
    throw error;
  }

  const connection = await pool.getConnection(); //створення окремого з'єднання для транзакції
  try {
    await connection.beginTransaction(); //початок транзакції (все або нічого)

    // 1. Перевірка дубліката назви організації(duplicate name)
    const [existing] = await connection.query(
      `SELECT org_id FROM organizations WHERE name = ? LIMIT 1`,
      [name],
    );

    //якщо знайдено - вже існує, то  конфлікт
    if (existing.length > 0) {
      // створення кастомної помилки (Conflict)
      const error = new Error("Organization with this name already exists");
      error.status = 409;
      error.field = "name";
      throw error;
    }

    // 2. Створення нової організації (pending)
    const [result] = await connection.query(
      `
      INSERT INTO organizations
      (name, description, website_url, status, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', true, NOW(), NOW())
      `,
      [name, description || null, website_url || null],
    );
    // отримання ID нової організації
    const orgId = result.insertId;

    // 3. Додавання категорій, зв'язок(many-to-many) між organizations і categories
    for (const categoryId of category_ids) {
      //  зв'язок організації з категоріями
      await connection.query(
        `
        INSERT INTO organization_categories (org_id, category_id)
        VALUES (?, ?)
        `,
        [orgId, categoryId],
      );
    }
    // підтвердження запису до БД
    await connection.commit();

    // 4. Успішна відповідь клієнту (created)
    return res.status(201).json({
      message: "Organization request created successfully",
      organization_id: orgId,
      status: "pending",
    });
    // Відкат транзакції при помилці
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    //   закриття з'єднання (для MySQL pool)
    connection.release();
  }
};

module.exports = {
  createOrganization, // Експорт функцій контролера
};
