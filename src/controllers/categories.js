// Контролер категорій — обробляє HTTP-запити для /api/categories
// Викликає функції з репозиторію category.js та формує JSON-відповідь
import { findAllCategories } from "../repositories/category.js"

// GET /api/categories
// Повертає список усіх категорій у системі
// Помилки бази даних автоматично перехоплюються asyncHandler → errorHandler
export const getAllCategories = async (_req, res) => {
	const categories = await findAllCategories()
	res.json(categories)
}
