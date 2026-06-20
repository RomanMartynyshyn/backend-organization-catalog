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
                        district: location.district,
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

// Пошук організацій за query parameters.
// Підтримує фільтрацію за: категорією, статусом, географічним радіусом та районом.
export async function findOrganizations(filters, pagination) {
    try {
        const { categoryId, status, geoParams, districts } = filters ?? {};

        // Об'єкт для умов фільтрації по таблиці locations.
        // Важливо: geoParams (радіус) і districts (район) МУСЯТЬ бути об'єднані
        // в єдиний об'єкт locationConditions і передані в ONE `locations.some`.
        // Якби ми використали два окремих `locations: { some: {...} }` у where,
        // Prisma б перезаписала перший ключ другим — і один із фільтрів ігнорувався б.
        const locationConditions = {};

        // Якщо передано координати та радіус — обчислюємо bounding box
        // (прямокутник навколо точки) і фільтруємо локації, що потрапляють у нього.
        if (geoParams) {
            const { minLat, maxLat, minLng, maxLng } = getBoundingBox(geoParams);
            locationConditions.latitude = { gte: minLat, lte: maxLat };
            locationConditions.longitude = { gte: minLng, lte: maxLng };
        }

        // Якщо передано один або кілька районів — додаємо умову `district IN (...)`.
        // `districts` — це масив рядків, сформований у контролері з query-параметра.
        if (districts && districts.length > 0) {
            locationConditions.district = { in: districts };
        }

        // Базові умови пошуку: статус (за замовчуванням — approved) та категорія.
        const where = {
            status: status ?? OrganizationStatus.approved,
            ...categoryFilter(categoryId),
        };

        // Додаємо фільтр по локаціях лише якщо є хоча б одна умова.
        // `some` означає: організація включається, якщо ХОЧА Б ОДНА її локація
        // відповідає всім вказаним умовам (район, координати).
        if (Object.keys(locationConditions).length > 0) {
            where.locations = {
                some: locationConditions,
            };
        }

        return await prisma.organization.findMany({
            where,
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

// Нова функція для отримання списку всіх унікальних районів з бази даних.
// Вона потрібна фронтенду, щоб автоматично будувати випадаючий список районів
// для фільтрації, замість того, щоб вписувати ці райони в код фронтенду вручну.
export async function getUniqueDistricts() {
    try {
        const locations = await prisma.location.findMany({
            where: {
                district: { not: null },
            },
            select: {
                district: true,
            },
            distinct: ['district'],
        });
        
        return locations
            .map((loc) => loc.district)
            .filter((d) => d && d !== 'Поза межами відомих районів')
            .sort((a, b) => a.localeCompare(b, 'uk')); // сортуємо за алфавітом
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch unique districts');
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
            select: {
                locationId: true,
                street: true,
                city: true,
                region: true,
                postCode: true,
                latitude: true,
                longitude: true,
                district: true
            },
        },
    }
}
