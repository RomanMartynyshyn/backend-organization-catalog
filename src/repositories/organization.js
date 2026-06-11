import { prisma } from '../db/prisma.js';
import { OrganizationStatus } from '../db/definitions.js';
import { getBoundingBox } from '../utils/geoUtils.js';

// Запити до таблиці ORGANIZATIONS

// Створення нової організації.
export async function createOrganization(newOrganization, categoryIds, locations) {
    try {
        return await prisma.organization.create({
            data: {
                name: newOrganization.name,
                description: newOrganization.description,
                websiteUrl: newOrganization.websiteUrl,
                status: OrganizationStatus.pending,
                categories: {
                    create: categoryIds.map((categoryId) => ({
                        category: {
                            connect: {
                                id: Number(categoryId),
                            },
                        },
                    })),
                },
                locations: {
                    create: locations.map((location) => ({
                        street: location.street,
                        city: location.city,
                        region: location.region,
                        postCode: location.postCode,
                        latitude: location.latitude,
                        longitude: location.longitude,
                    })),
                },
            },
            include: organizationWithCategoriesAndLocations(),
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create organization');
    }
}

// Призначення нової категорії до організації(organizationCategory)
export async function assignCategoryToOrganization(orgId, categoryId) {
    try {
        return await prisma.organizationCategory.create({
            data: {
                organizationId: Number(orgId),
                categoryId: Number(categoryId),
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error(`Failed to assign category to organization: ${orgId},${categoryId}`);
    }
}

// Пошук організацій за query parameters
export async function findOrganizations(filters, pagination) {
    try {
        const { categoryId, status, geoParams } = filters ?? {};

        return await prisma.organization.findMany({
            where: {
                status: status ?? OrganizationStatus.approved,
                ...categoryFilter(categoryId),
                ...geoFilter(geoParams),
            },
            include: organizationWithCategoriesAndLocations(),
            orderBy: {
                createdAt: 'desc',
            },
            ...(pagination?.limit !== undefined ? { take: Number(pagination.limit) } : {}),
            ...(pagination?.offset !== undefined ? { skip: Number(pagination.offset) } : {}),
        });

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch organizations by query');
    }
}

// Пошук організації за ID
export async function findOrganizationById(orgId) {
    try {
        return await prisma.organization.findUnique({
            where: {
                id: Number(orgId),
            },
            include: organizationWithCategoriesAndLocations(),
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error(`Failed to find organization by ID: ${orgId}`);
    }
}

// Запит на зміну статусу організації
export async function setOrganizationStatus(
    orgId,
    status,
    rejectionReason
) {
    try {
        return await prisma.organization.update({
            where: {
                id: Number(orgId),
            },

            data: {
                status: status,
                rejectionReason: rejectionReason,
            },
            include: organizationWithCategoriesAndLocations(),
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error(`Failed to set organization status: ${orgId}`);
    }
}

/// Filter functions

function geoFilter(geoParams) {
    if (!geoParams) {
        return {};
    }

    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(geoParams);

    return {
        locations: {
            some: {
                latitude: { gte: minLat, lte: maxLat },
                longitude: { gte: minLng, lte: maxLng },
            },
        },
    };
}

function categoryFilter(categoryId) {
    return categoryId === undefined ? {} : {
        categories: {
            some: {
                categoryId: Number(categoryId),
            },
        },
    }
}

// Include functions
function organizationWithCategoriesAndLocations() {
    return {
        categories: {
            select: { category: { select: { id: true, name: true } } },
        },
        locations: {
            select: { locationId: true, street: true, city: true, region: true, postCode: true, latitude: true, longitude: true },
        },
    }
}
