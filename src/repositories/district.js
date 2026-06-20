import { prisma } from '../db/prisma.js';

// Репозиторій для роботи з таблицею locations у частині районів (district).
// Використовується для надання фронтенду списку доступних районів для UI-фільтрів.

/**
 * Повертає список усіх унікальних районів із таблиці locations.
 *
 * Логіка:
 * - Фільтруємо записи, де district IS NOT NULL (виключаємо локації без району).
 * - Використовуємо `distinct: ['district']`, щоб Prisma повернула лише унікальні значення
 *   і не дублювала райони, які зустрічаються у кількох локаціях.
 * - Сортуємо за алфавітом для зручності відображення у дропдауні.
 * - Форматуємо результат у масив об'єктів { id, name }, де id === name (рядкове значення),
 *   щоб фронтенд міг одразу використати це у select/checkbox без додаткових перетворень.
 *
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function findAllDistricts() {
    try {
        const locations = await prisma.location.findMany({
            where: {
                district: {
                    not: null, // виключаємо локації без вказаного району
                },
            },
            distinct: ['district'], // лише унікальні значення районів
            select: {
                district: true, // вибираємо тільки поле district, решта не потрібна
            },
            orderBy: {
                district: 'asc', // алфавітний порядок для UI
            },
        });

        // Перетворюємо масив рядків на масив об'єктів { id, name }
        // зручний для фронтенд-компонентів (select, checkbox-list тощо)
        return locations.map(l => ({ id: l.district, name: l.district }));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch all districts');
    }
}
