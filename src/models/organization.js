const Organization = require("../models/organization");

// Створення заявки на додавання організації
// контролер POST запиту (створення заявки)
const createOrganization = async (req, res) => {
  const { name, description, website_url, category_ids } = req.body; //отримання даних з body (форми заявки)

  // 1. Перевірка дубліката назви організації через модель
  // звернення до БД для перевірки чи існує організація з таким name
  const existing = await Organization.findByName(name);

  //якщо знайдено - вже існує, то  конфлікт
  if (existing) {
    const error = new Error("Organization with this name already exists");
    error.status = 409;
    error.field = "name";
    throw error;
  }

  // Створення організації через модель
  // бізнес-логіка винесена в model layer (MVC архітектура)
  const result = await Organization.create(
    name,
    description,
    website_url,
    category_ids,
  );

  // Відповідь клієнту після успішного створення заявки
  return res.status(201).json({
    message: "Organization request created successfully",
    organization_id: result.orgId,
    status: result.status,
  });
};

module.exports = {
  createOrganization,
};
