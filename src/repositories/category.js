import { prisma } from '../db/prisma.js';

// Запити до таблиці CATEGORIES та ORGANIZATION_CATEGORIES
// Запит на отримання всіх категорій
export async function findAllCategories() {
    try {
        return await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch all categories');
    }
}


