import { findAllDistricts } from "../repositories/district.js";

// GET /api/districts
// Повертає список усіх унікальних районів у системі
export const getAll = async (_req, res) => {
    const districts = await findAllDistricts();
    res.json(districts);
};
