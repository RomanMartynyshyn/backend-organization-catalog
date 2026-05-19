import { prisma } from '../utils/db.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { parseCSV } from '../utils/csvParser.js'

// GET /api/organizations?category_id=&status=
export const getOrganizations = asyncHandler(async (req, res) => {
	const { category_id, status } = req.query

	// Якщо передано status — адмін-запит (модерація)
	// Інакше — публічний каталог: тільки approved
	const statusFilter = status ?? 'approved'

	const where = {
		status: statusFilter,
		...(category_id && {
			categories: {
				some: { category_id: Number(category_id) },
			},
		}),
	}

	const organizations = await prisma.organization.findMany({
		where,
		select: {
			org_id: true,
			name: true,
			description: true,
			website_url: true,
			status: true,
			created_at: true,
			categories: {
				select: {
					category: { select: { category_id: true, name: true } },
				},
			},
		},
		orderBy: { created_at: 'desc' },
	})

	const result = organizations.map(normalizeOrg)
	res.json(result)
})

// GET /api/organizations/:id
export const getOrganizationById = asyncHandler(async (req, res) => {
	const org = await prisma.organization.findUnique({
		where: { org_id: Number(req.params.id) },
		include: {
			categories: {
				select: {
					category: { select: { category_id: true, name: true } },
				},
			},
		},
	})

	if (!org) {
		return res.status(404).json({ message: 'Organization not found' })
	}

	res.json(normalizeOrg(org))
})

// POST /api/organizations
export const createOrganization = asyncHandler(async (req, res) => {
	const { name, description, website_url, category_ids } = req.body

	const existing = await prisma.organization.findFirst({ where: { name } })
	if (existing) {
		return res
			.status(409)
			.json({ message: 'Organization with this name already exists' })
	}

	const org = await prisma.organization.create({
		data: {
			name,
			description: description ?? null,
			website_url: website_url ?? null,
			status: 'pending',
			categories: {
				create: category_ids.map(id => ({ category_id: id })),
			},
		},
		include: {
			categories: {
				select: { category: { select: { category_id: true, name: true } } },
			},
		},
	})

	res.status(201).json(normalizeOrg(org))
})

// POST /api/organizations/import
export const importOrganizations = asyncHandler(async (req, res) => {
	if (!req.file) {
		return res
			.status(400)
			.json({ errors: [{ field: 'file', message: 'CSV file is required' }] })
	}

	const { rows, errors: parseErrors } = await parseCSV(req.file.buffer)

	if (!rows.length && parseErrors.length) {
		return res.status(400).json({ errors: parseErrors })
	}

	const created = []
	const errors = [...parseErrors]

	for (const [i, row] of rows.entries()) {
		const rowNum = i + 2 // +2: рядок 1 — заголовок

		if (!row.name || row.name.trim().length < 2) {
			errors.push({
				row: rowNum,
				field: 'name',
				message: 'name is required (min 2 chars)',
			})
			continue
		}

		const existing = await prisma.organization.findFirst({
			where: { name: row.name.trim() },
		})
		if (existing) {
			errors.push({
				row: rowNum,
				field: 'name',
				message: `Duplicate: "${row.name}" already exists`,
			})
			continue
		}

		const org = await prisma.organization.create({
			data: {
				name: row.name.trim(),
				description: row.description?.trim() || null,
				website_url: row.website_url?.trim() || null,
				status: 'pending',
			},
		})
		created.push(org.org_id)
	}

	res.status(207).json({
		created: created.length,
		errors,
	})
})

// PUT /api/organizations/:id/status
export const updateOrganizationStatus = asyncHandler(async (req, res) => {
	const { status, rejection_reason } = req.body
	const orgId = Number(req.params.id)

	const org = await prisma.organization.findUnique({ where: { org_id: orgId } })
	if (!org) {
		return res.status(404).json({ message: 'Organization not found' })
	}

	const updated = await prisma.organization.update({
		where: { org_id: orgId },
		data: {
			status,
			rejection_reason:
				status === 'rejected' ? (rejection_reason ?? null) : null,
			approved_at: status === 'approved' ? new Date() : undefined,
			updated_at: new Date(),
		},
	})

	res.json(normalizeOrg(updated))
})

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeOrg(org) {
	return {
		...org,
		categories: org.categories?.map(c => c.category) ?? [],
	}
}
