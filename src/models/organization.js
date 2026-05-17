const pool = require("../db"); // підключення пулу MySQL (з'єднання з БД)

// перевірка дубліката організації по name
// використовується для запобігання дублюванню записів (409 Conflict у контролері)
async function findByName(name) {
  const [rows] = await pool.query(
    `SELECT org_id FROM organizations WHERE name = ? LIMIT 1`,
    [name],
  );

  return rows[0]; // повертаємо перший знайдений запис або undefined
}

// створення організації + зв'язки many-to-many з категоріями
async function create(name, description, website_url, category_ids) {
  const connection = await pool.getConnection(); // створення окремого з'єднання для транзакції

  try {
    await connection.beginTransaction(); // початок транзакції (успіх або відкат всіх змін)

    // 1. вставка організації зі статусом pending
    const [result] = await connection.query(
      `
      INSERT INTO organizations
      (name, description, website_url, status, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', true, NOW(), NOW())
      `,
      [name, description || null, website_url || null],
    );

    const orgId = result.insertId; // отримання ID створеної організації

    // 2. створення зв'язків many-to-many між organizations і categories
    for (const categoryId of category_ids) {
      await connection.query(
        `
        INSERT INTO organization_categories (org_id, category_id)
        VALUES (?, ?)
        `,
        [orgId, categoryId],
      );
    }

    await connection.commit(); // підтвердження транзакції (збереження запису до БД)

    return {
      orgId,
      status: "pending", // статус нової заявки
    };
  } catch (error) {
    await connection.rollback(); // відкат змін у випадку помилки
    throw error;
  } finally {
    connection.release(); // звільнення з'єднання з пулу (для MySQL)
  }
}

module.exports = {
  findByName,
  create,
};
