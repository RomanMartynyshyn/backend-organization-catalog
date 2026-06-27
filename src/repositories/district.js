import { prisma } from '../db/prisma.js';

// Запит на отримання всіх адміністративних одиниць (райони міста + ОТГ)
export async function findAllDistricts() {
    try {
        return await prisma.adminUnit.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch all admin units');
    }
}