import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шлях до твого ідеального файлу, який ти щойно викачав
const geojsonPath = path.join(__dirname, 'geoParser', 'kr_districts.geojson');

let krDistricts = [];

function initGeoData() {
  if (!fs.existsSync(geojsonPath)) {
    console.error(`❌ Помилка: Файл не знайдено за шляхом: ${geojsonPath}`);
    return;
  }
  
  // Читаємо твої 7 районів міста з диску
  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  krDistricts = geojsonData.features || [];
}

// Ініціалізуємо дані при старті бекенду
initGeoData();

export async function getDistrictByCoords(lat, lon) {
  if (krDistricts.length === 0) {
    initGeoData();
  }

  if (!lat || !lon) return "Координати відсутні";

  // Важливо: Turf приймає [Longitude, Latitude]
  const pt = point([parseFloat(lon), parseFloat(lat)]);

  // Проганяємо точку через полігони твого файлу
  for (const feature of krDistricts) {
    if (turfBooleanPointInPolygon(pt, feature)) {
      // Повертає красиву назву району українською
      return feature.properties.name || "Назва району відсутня";
    }
  }

  return "Поза межами відомих районів";
}