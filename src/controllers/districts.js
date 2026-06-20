import { findAllDistricts } from "../repositories/district.js";

// Контролер районів — обробляє HTTP-запити для /api/districts.
// Делегує всю роботу з базою даних до репозиторію district.js.

/**
 * GET /api/districts
 * Повертає список усіх унікальних районів із бази даних.
 *
 * Призначення: надати фронтенду актуальний перелік районів для
 * динамічного заповнення UI-фільтрів (select, checkbox тощо).
 * Таким чином фронтенд не зберігає статичний список районів у коді,
 * а завжди отримує актуальні дані з БД.
 *
 * Відповідь: масив об'єктів [{ id: string, name: string }]
 * Помилки БД автоматично перехоплюються asyncHandler → errorHandler.
 */
export const getAll = async (_req, res) => {
    const districts = await findAllDistricts();
    res.json(districts);
};
