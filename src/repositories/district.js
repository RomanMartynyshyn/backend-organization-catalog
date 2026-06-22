import { prisma } from '../db/prisma.js';

// Запит на отримання всіх районів
export async function findAllDistricts() {
    try {
        return await prisma.district.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch all districts');
    }
}
