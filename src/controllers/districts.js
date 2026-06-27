import { findAllDistricts } from "../repositories/district.js";

// GET /api/districts
// Повертає список усіх адміністративних одиниць (райони міста та ОТГ).

export const getAllDistricts = async (_req, res) => {
    const districts = await findAllDistricts();
    res.json(districts.map(mapAdminUnitToDto));
};

function mapAdminUnitToDto(unit) {
    return {
        id: unit.adminUnitId,
        name: unit.name,
        type: unit.type,
        parentId: unit.parentId ?? null,
    };
}