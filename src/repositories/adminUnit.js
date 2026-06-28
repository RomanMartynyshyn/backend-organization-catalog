import { prisma } from '../db/prisma.js';

export async function findAdminUnits() {
    try {
        return await prisma.adminUnit.findMany({
            orderBy: [
                { parentId: 'asc' },
                { name: 'asc' },
            ],
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch admin units');
    }
}