import { prisma } from '../db/prisma.js';

// Запит на отримання всіх унікальних районів
export async function findAllDistricts() {
    try {
        const locations = await prisma.location.findMany({
            where: {
                district: {
                    not: null,
                },
            },
            distinct: ['district'],
            select: {
                district: true,
            },
            orderBy: {
                district: 'asc',
            },
        });
        // Повертаємо райони у форматі, зручному для селекту на фронтенді
        return locations.map(l => ({ id: l.district, name: l.district }));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch all districts');
    }
}
