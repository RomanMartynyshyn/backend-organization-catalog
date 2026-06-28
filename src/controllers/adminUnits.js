import { findAdminUnits } from '../repositories/adminUnit.js';

// GET /api/admin-units
// Повертає список усіх адміністративних одиниць
export const getAdminUnits = async (req, res) => {
    const adminUnits = await findAdminUnits();
    res.json(adminUnits);
};