import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Старий шлях, який ламав пошук файлу. Залишено коментарем для історії правки.
// const geojsonPath = path.join(__dirname, 'geoParser', 'kr_districts.geojson');

/*
  Тут `__dirname` уже вказує на папку `geoParser`.
  Тому зайва вкладеність `geoParser/geoParser` прибирається, і файл читається напряму.
*/
const geojsonPath = path.join(__dirname, 'kr_districts.geojson');

let krDistricts = [];

// Підтягуємо геодані одразу при старті модуля, щоб не читати файл на кожен запит.
function initGeoData() {
  if (!fs.existsSync(geojsonPath)) {
    console.error(`Помилка: файл не знайдено за шляхом: ${geojsonPath}`);
    return;
  }

  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  krDistricts = geojsonData.features || [];
}

// Ініціалізуємо дані один раз одразу після завантаження модуля.
initGeoData();

// Повертає назву району для координат, якщо точка потрапила всередину полігона.
export function getAdminUnitByCoords(lat, lon) {
  if (krDistricts.length === 0) {
    initGeoData();
  }

  if (!lat || !lon) return 'Координати відсутні';

  const pt = point([parseFloat(lon), parseFloat(lat)]);

  const adminUnitFeatures = [];
  // Перевіряємо кожен полігон району, поки не знайдемо збіг.
  for (const feature of krDistricts) {
    if (turfBooleanPointInPolygon(pt, feature)) {
      adminUnitFeatures.push(feature);
    }
  }

  // if (adminUnitFeatures.length > 1)
  //   for (const feature of adminUnitFeatures) {
  //     console.log(feature.properties.admin_level + ' - ' + feature.properties.name)
  //   }

  if (adminUnitFeatures.length > 0) {
    adminUnitFeatures
        .sort((a, b) => b.properties.admin_level - a.properties.admin_level)
    return adminUnitFeatures[0].properties.name || 'Назва району відсутня';
  }

  return 'Поза межами відомих районів';
}
