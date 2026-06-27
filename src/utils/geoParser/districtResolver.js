import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geojsonPath = path.join(__dirname, 'kr_districts.geojson');

/*
  Шлях до файлу з поштовими індексами.
  postcode_map_full.geojson містить записи для всього Криворізького району:
  і для самого міста Кривий Ріг, і для всіх навколишніх населених пунктів.

  Структура кожного запису:
  {
    "properties": {
      "postcode": "50480",
      "settlementName": "с-ще Гірницьке"
    },
    "geometry": null
  }

  Поле "community" у файлі відсутнє — використовуємо "settlementName".
*/
const postcodeMapPath = path.join(__dirname, 'postcode_map_full.geojson');

/*
  Назва населеного пункту Кривий Ріг у файлі postcode_map_full.geojson.
  Записи з такою settlementName навмисно ігноруємо під час ініціалізації —
  організації міста повинні визначатись виключно через полігони районів
  за координатами (getDistrictByCoords), а не через postcode-lookup.
*/
const KR_SETTLEMENT_NAME = 'м. Кривий Ріг';

let krDistricts = [];
let postcodeToOtgMap = new Map();
let uniqueOtgs = new Set();

// Підтягуємо геодані одразу при старті модуля, щоб не читати файл на кожен запит.
function initGeoData() {
  if (!fs.existsSync(geojsonPath)) {
    console.error(`Помилка: файл не знайдено за шляхом: ${geojsonPath}`);
    return;
  }

  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  krDistricts = geojsonData.features || [];
}

initGeoData();

/*
  Будуємо словник postcode → settlementName для всіх населених пунктів
  за межами міста Кривий Ріг.

  Чому ігноруємо KR_SETTLEMENT_NAME:
  Місто Кривий Ріг поділено на 7 районів (полігони в kr_districts.geojson).
  Якби ми додали KR-postcodes в postcodeToOtgMap, організації міста отримували б
  settlementName "м. Кривий Ріг" замість конкретного району (Саксаганський,
  Інгулецький тощо). Тому для міста завжди використовуємо координатну логіку.

  Деякі населені пункти мають кілька postcodes — це нормально,
  Map просто збереже кілька ключів з однаковим значенням.
*/
function initPostcodeData() {
  if (!fs.existsSync(postcodeMapPath)) {
    console.error(`Помилка: файл не знайдено за шляхом: ${postcodeMapPath}`);
    return;
  }

  const postcodeData = JSON.parse(fs.readFileSync(postcodeMapPath, 'utf8'));
  const features = postcodeData.features || [];

  for (const feature of features) {
    if (!feature.properties) continue;

    const postcode = String(feature.properties.postcode ?? '').trim();
    const settlementName = feature.properties.settlementName ?? null;

    if (!postcode || !settlementName) continue;

    // Місто Кривий Ріг — лишаємо на координатну логіку районів.
    if (settlementName === KR_SETTLEMENT_NAME) continue;

    postcodeToOtgMap.set(postcode, settlementName);
    uniqueOtgs.add(settlementName);
  }
}

initPostcodeData();

// Повертає назву району міста для координат, якщо точка потрапила всередину полігона.
export function getDistrictByCoords(lat, lon) {
  if (krDistricts.length === 0) {
    initGeoData();
  }

  if (!lat || !lon) return 'Координати відсутні';

  const pt = point([parseFloat(lon), parseFloat(lat)]);

  for (const feature of krDistricts) {
    if (turfBooleanPointInPolygon(pt, feature)) {
      return feature.properties.name || 'Назва району відсутня';
    }
  }

  return 'Поза межами відомих районів';
}

/*
  Повертає settlementName за poscode, або null якщо:
    - postcode відсутній,
    - postcode належить місту Кривий Ріг (відфільтровано в initPostcodeData),
    - postcode не знайдено в таблиці.

  При null — geoJsonParser.js перейде до getDistrictByCoords.
*/
export function getOtgByPostcode(postcode) {
  if (postcodeToOtgMap.size === 0) {
    initPostcodeData();
  }

  if (!postcode) return null;

  const normalizedPostcode = String(postcode).trim();
  return postcodeToOtgMap.get(normalizedPostcode) ?? null;
}

/*
  Повертає масив унікальних settlementName всіх населених пунктів
  за межами міста Кривий Ріг.
  Використовується в geoJsonParser.js для динамічного формування DISTRICTS.
*/
export function getUniqueOtgs() {
  if (uniqueOtgs.size === 0) {
    initPostcodeData();
  }
  return Array.from(uniqueOtgs);
}