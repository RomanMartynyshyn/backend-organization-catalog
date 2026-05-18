const { pool } = require("../db");

class Category {
    static async getAll() {
        const [rows] = await pool.query(
        `
          SELECT category_id, name
          FROM categories
          ORDER BY name
        `
        );

        return rows;
    }
}

module.exports = Category;