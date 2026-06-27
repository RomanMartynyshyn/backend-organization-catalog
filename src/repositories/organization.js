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
                // Зв'язок з головною локацією: передається після того, як локації будуть створені.
                ...(newOrganization.primaryLocationId != null
                    ? { primaryLocationId: newOrganization.primaryLocationId }
                    : {}),
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
                        latitude: location.latitude,
                        longitude: location.longitude,
                        // Посилання на адміністративну одиницю (ADMIN_UNITS).
                        // city/region/postCode більше не зберігаються окремо —
                        // вони визначаються ієрархією через adminUnitId.
                        adminUnitId: location.adminUnitId,
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
        const { categoryId, status, geoParams, districtIds, search } = filters ?? {};

        return await prisma.organization.findMany({
            where: {
                status: status ?? OrganizationStatus.approved,
                ...categoryFilter(categoryId),
                ...locationFilter(geoParams, districtIds),
                ...searchFilter(search),
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
    if (!geoParams && !districtIds) { }

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
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
    };
}

function districtFilter(adminUnitIds) {
    if (!adminUnitIds) {
        return {};
    }

    const adminUnitIdsNumbers = adminUnitIds.map(Number);

    // Фільтруємо за adminUnitId окремих локацій організацій.
    // Раніше було districtId, нова єдина таблиця ADMIN_UNITS об'єднує райони та ОТГ.
    return {
        adminUnitId: { in: adminUnitIdsNumbers }
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

function searchFilter(search) {
    if (!search) {
        return {};
    }
    return {
        OR: [
            { name: { contains: search } },
            { description: { contains: search } },
        ],
    };
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
                latitude: true,
                longitude: true,
                // Адміністративна одиниця (район або ОТГ).
                // city/region/postCode вилучено — всі ці дані є частиною ієрархії ADMIN_UNITS.
                adminUnit: {
                    select: {
                        adminUnitId: true,
                        name: true,
                        type: true,
                        parentId: true,
                    },
                }
            },
        },
    }
}
