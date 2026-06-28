import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Виправив імпорт: стара назва getDistrictByCoords більше не існує це залишилось після рефакторингу.
// Змінив її на правильну назву getAdminUnitByCoords відповідно до поточного API districtResolver.js
import { getAdminUnitByCoords } from './src/utils/geoParser/districtResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parsedDataPath = path.join(__dirname, 'src', 'utils', 'geoParser', 'parsedData.json');

async function testAllDatabaseLocations() {
  console.log("🚀 Запуск виправленого ГІС-тесту бази даних...");

  if (!fs.existsSync(parsedDataPath)) {
    console.error(`❌ Помилка: Файл не знайдено за шляхом: ${parsedDataPath}`);
    return;
  }

  const db = JSON.parse(fs.readFileSync(parsedDataPath, 'utf8'));

  const organizations = db.ORGANIZATIONS || [];
  const locations = db.LOCATIONS || [];

  console.log(`📋 Усього організацій: ${organizations.length}, Локацій: ${locations.length}`);
  console.log("------------------------------------------------------------------------");

  // Беремо перші 15 організацій для наочного тесту
  const testPool = organizations.slice(0, 5);
  let counter = 0;

  for (const org of testPool) {
    const orgName = org.name || "Без назви";

    // КРИТИЧНЕ ВИПРАВЛЕННЯ: JSON використовує 'org_id' в ORGANIZATIONS
    const currentOrgId = org.org_id;

    if (!currentOrgId) continue;

    // Зв'язуємо з 'organization_id' в таблиці LOCATIONS
    const linkedLocation = locations.find(loc => loc.organization_id === currentOrgId);

    if (!linkedLocation) {
      console.log(`📍 \x1b[33m${orgName}\x1b[0m — локацію в базі не знайдено`);
      console.log("------------------------------------------------------------------------");
      continue;
    }

    const lat = linkedLocation.latitude;
    const lon = linkedLocation.longitude;

    if (!lat || !lon) continue;

    counter++;

    // Тут оновив виклик функції: тепер ми визначаємо адмін. одиницю через оновлений resolver.
    const district = await getAdminUnitByCoords(lat, lon);

    console.log(`[#${counter}] 📍 \x1b[36m${orgName}\x1b[0m`);
    console.log(`🏠 Адреса: вул. ${linkedLocation.street}, буд. ${linkedLocation.building}`);
    console.log(`🌐 Координати з бази: [${lat}, ${lon}]`);
    console.log(`🏢 Район міста: \x1b[32m${district}\x1b[0m`);
    console.log("------------------------------------------------------------------------");
  }

  console.log(`\n✅ Успішно протестовано реальних локацій: ${counter}`);
}

testAllDatabaseLocations();