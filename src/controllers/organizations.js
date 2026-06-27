import {
	createOrganization,
	findOrganizations,
	findOrganizationById,
	setOrganizationStatus,
} from '../repositories/organization.js'
import { OrganizationStatus } from '../db/definitions.js'

// GET /api/organizations?status=<status>&category_id=<categoryId>&limit=<limit>&offset=<offset>&lat=47.9387000&lng=33.4324000&radiusKm=5&adminUnitId=<adminUnitId>
export const getOrganisations = async (req, res) => {
	const { status, category_id, categoryId, lat, lng, radiusKm, limit, offset, adminUnitId, search } = req.query

	// Підтримка передачі одного або кількох adminUnitId через query-параметр.
	// Раніше було districtId, замінено на adminUnitId відповідно до нової структури ADMIN_UNITS.
	const adminUnitIds = Array.isArray(adminUnitId)
		? adminUnitId
		: adminUnitId ? [adminUnitId] : undefined;

	const filters = {
		categoryId: categoryId ?? category_id,
		status,
		geoParams: lat !== undefined && lng !== undefined && radiusKm !== undefined
			? { lat, lng, radiusKm }
			: undefined,
		districtIds: adminUnitIds, // передаємо в репозиторій під старою назвою (districtFilter всередині вже застосовує adminUnitId)
		search: search,
	}
	// Задаємо ліміт: якщо ліміт передано у запиті, обмежуємо його максимум 15 елементами.
	// Якщо ліміт не передано, за замовчуванням повертаємо 15 елементів.
	const parsedLimit = limit !== undefined ? Math.min(parseInt(limit, 10), 15) : 15

	// Задаємо зміщення (offset): якщо передано у запиті, використовуємо його для сторінкової навігації,
	// інакше за замовчуванням починаємо з 0 (перша сторінка).
	const parsedOffset = offset !== undefined ? parseInt(offset, 10) : 0

	// Об'єднуємо параметри пагінації для передачі в репозиторій
	const pagination = { limit: parsedLimit, offset: parsedOffset }

	const organizations = await findOrganizations(
		filters,
		pagination
	)

	res.json(organizations.map(mapOrganisationToDto))

}

// GET /api/organizations/:id
export const getById = async (req, res) => {
	const id = parseInt(req.params.id, 10)
	if (isNaN(id)) {
		return res.status(400).json({
			errors: [{ field: 'id', message: 'Invalid organization ID' }]
		})
	}

	const org = await findOrganizationById(id)
	if (!org) {
		return res.status(404).json({
			errors: [{ field: 'id', message: 'Organization not found' }]
		})
	}

	res.json(mapOrganisationToDto(org))
}

// POST /api/organizations
export const create = async (req, res) => {
	const { name, description, websiteUrl, contacts, socialLinks, workingHours, categoryIds, locations, primaryLocationId } = req.body

	if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
		return res.status(400).json({
			errors: [{ field: 'categoryIds', message: 'categoryIds must be a non-empty array' }]
		})
	}

	const org = await createOrganization(
		{
			name,
			description,
			websiteUrl,
			contacts,
			socialLinks,
			workingHours,
			// Головна локація організації (первинна адреса для відображення на картці та в картках)
			primaryLocationId: primaryLocationId ?? null,
		},
		categoryIds,
		locations,
	)

	res.status(201).json(mapOrganisationToDto(org))
}

// PUT /api/organizations/:id/status
export const updateStatus = async (req, res) => {
	const id = parseInt(req.params.id, 10)
	if (isNaN(id)) {
		return res.status(400).json({
			errors: [{ field: 'id', message: 'Invalid organization ID' }]
		})
	}

	const { status, rejectionReason } = req.body

	const validStatuses = Object.values(OrganizationStatus)
	if (!validStatuses.includes(status)) {
		return res.status(400).json({
			errors: [{ field: 'status', message: `Invalid status. Allowed: ${validStatuses.join(', ')}` }]
		})
	}

	const org = await findOrganizationById(id)
	if (!org) {
		return res.status(404).json({
			errors: [{ field: 'id', message: 'Organization not found' }]
		})
	}

	const updatedOrg = await setOrganizationStatus(
		id,
		status,
		rejectionReason ?? null,
	)
	res.json(mapOrganisationToDto(updatedOrg))
}

function mapOrganisationToDto(org) {
	return {
		...org,
		categories: org.categories?.map(c => c.category) ?? [],
		locations: org.locations?.map(l => ({
			id: l.locationId,
			street: l.street,
			latitude: l.latitude,
			longitude: l.longitude,
			// Адміністративна одиниця (ADMIN_UNITS): район міста або ОТГ.
			// city/region/postCode вилучено, інформація передається через adminUnit.
			adminUnit: l.adminUnit ?? null,
		})) ?? [],
	}
}