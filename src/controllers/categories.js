// CRUD операції та бізнес логіка
const Category = require("../models/category.js");

// Отримання всіх категорій
exports.getCategories = async (req, res) => {
    const categories = await Category.getAll();
    return res.status(200).json(categories);
};

module.exports = {
    getCategories,
};
