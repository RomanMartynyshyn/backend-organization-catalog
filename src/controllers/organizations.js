import {
	createOrganization,
	findOrganizations,
	findOrganizationById,
	setOrganizationStatus,
} from '../repositories/organization.js'
import { OrganizationStatus } from '../db/definitions.js'
import { parseCSV } from '../utils/csvParser.js'

// GET /api/organizations?status=<status>&category_id=<categoryId>&limit=<limit>&offset=<offset>&lat=47.9387000&lng=33.4324000&radiusKm=5
export const getOrganisations = async (req, res) => {
	const { status, category_id: categoryId, lat, lng, radiusKm, limit, offset } = req.query
	const filters = {
		categoryId,
		status,
		geoParams: lat !== undefined && lng !== undefined && radiusKm !== undefined
			? { lat, lng, radiusKm }
			: undefined,
	}
	const pagination = { limit, offset }

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
	const { name, description, websiteUrl, categoryIds, locations } = req.body

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

// POST /api/organizations/import
export const importCSV = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({
			errors: [{ field: 'file', message: 'CSV file is required' }]
		})
	}

	const { rows, errors: parseErrors } = await parseCSV(req.file.buffer)

	if (!rows.length && parseErrors.length) {
		return res.status(400).json({
			errors: parseErrors.map(e => ({
				field: e.field || `row_${e.row}`,
				message: e.error || e.message
			}))
		})
	}

	const errors = [...parseErrors]
	const validRows = []

	// Валідація рядків
	for (const [i, row] of rows.entries()) {
		const rowNum = i + 2
		if (!row.name || row.name.trim().length < 2) {
			errors.push({
				row: rowNum,
				field: 'name',
				message: 'name is required (min 2 chars)',
			})
			continue
		}
		validRows.push({ ...row, _rowNum: rowNum })
	}

	const created = []

	for (const row of validRows) {
		const org = await createOrganization({
			name: row.name.trim(),
			description: row.description?.trim() || null,
			websiteUrl: row.websiteUrl?.trim() || null,
			// TODO locations
		})
		created.push(org.id)
	}

	res.status(207).json({ created: created.length, errors })
}

function mapOrganisationToDto(org) {
	return {
		...org,
		categories: org.categories?.map(c => c.category) ?? [],
		locations: org.locations?.map(l => ({
			id: l.locationId,
			street: l.street,
			city: l.city,
			region: l.region,
			postCode: l.postCode,
			latitude: l.latitude,
			longitude: l.longitude,
		})) ?? [],
	}
}