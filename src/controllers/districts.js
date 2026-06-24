import { findAllDistricts } from "../repositories/district.js";

// GET /api/districts
// Повертає список усіх районів із бази даних.

export const getAllDistricts = async (_req, res) => {
    const districts = await findAllDistricts();
    res.json(districts);
};
