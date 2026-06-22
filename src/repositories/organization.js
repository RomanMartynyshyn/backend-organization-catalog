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
                contacts: newOrganization.contacts,
                socialLinks: newOrganization.socialLinks,
                workingHours: newOrganization.workingHours,
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
                        districtId: location.districtId,
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

// Підтримує фільтрацію за: категорією, статусом, географічним радіусом та районом.
export async function findOrganizations(filters, pagination) {
    try {
        const { categoryId, status, geoParams, districtIds } = filters ?? {};

        return await prisma.organization.findMany({
            where: {
                status: status ?? OrganizationStatus.approved,
                ...categoryFilter(categoryId),
                ...locationFilter(geoParams, districtIds),
            },
            include: organizationWithCategoriesAndLocations(),
            orderBy: [
                // Додали вторинне сортування за id. 
                // Це потрібно, щоб пагінація працювала стабільно і не видавала 
                // одні й ті самі "дублікати" організацій на різних сторінках, 
                // коли час їхнього створення (createdAt) абсолютно однаковий.
                { createdAt: 'desc' },
                { id: 'asc' }
            ],
            // Пагінація: take = ліміт записів, skip = зміщення (для сторінок).
            ...(pagination?.limit !== undefined ? { take: Number(pagination.limit) } : {}),
            ...(pagination?.offset !== undefined ? { skip: Number(pagination.offset) } : {}),
        });

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error(`Failed to fetch organizations by query: ${error.message}`);
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
function locationFilter(geoParams, districtIds) {
    if (!geoParams && !districtIds) {}

    return {
        locations: {
            some: {
                ...geoFilter(geoParams),
                ...districtFilter(districtIds),
            },
        },
    };
}

function geoFilter(geoParams) {
    if (!geoParams) {
        return {};
    }

    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(geoParams);

    return {
        latitude: {gte: minLat, lte: maxLat},
        longitude: {gte: minLng, lte: maxLng},
    };
}

function districtFilter(districtIds) {
    if (!districtIds) {
        return {};
    }

    const districtIdsNumbers = districtIds.map(Number);

    return {
        districtId: { in: districtIdsNumbers }
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
            select: {
                locationId: true,
                street: true,
                city: true,
                region: true,
                postCode: true,
                latitude: true,
                longitude: true,
                district: {
                    select: {
                        districtId: true,
                        name: true,
                    },
                }
            },
        },
    }
}
