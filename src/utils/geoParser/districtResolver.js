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
    /*
      Примітка: Array.prototype.sort() сортує масив "на місці" (мутує його in-place)
      і повертає той самий масив. Тому явне збереження результату не потрібне —
      після виклику .sort() перший елемент [0] вже буде з найбільшим admin_level.
      Сортуємо за спаданням admin_level: вищий рівень = детальніша одиниця (район > місто).
    */
    adminUnitFeatures.sort((a, b) => b.properties.admin_level - a.properties.admin_level);
    return adminUnitFeatures[0].properties.name || 'Назва району відсутня';
  }

  return 'Поза межами відомих районів';
}

/*
  Пошук назви адміністративної одиниці по поштовому коду.

  Ця функція є ОКРЕМОЮ від getAdminUnitByCoords навмисно:
  - getAdminUnitByCoords: геопросторовий lookup (точки у полігоні)
  - getAdminUnitByPostCode: lookup по поштовому індексу (статична таблиця)

  Обидві функції вирішують одну задачу (знайти admin unit), але різними способами.
  Розділення дозволяє: 1) використовувати їх незалежно, 2) тестувати окремо,
  3) не змішувати дві різних стратегії в одному місці.

  Таблиця відповідностей побудована на основі реальних даних export.geojson.
  Логіка: перевіряємо більш специфічні префікси ПЕРШИМИ (довші перед коротшими),
  щоб `5386x` не потрапило в більш загальний `538x`.

  Повертає назву admin unit або null, якщо post_code не розпізнано.
  Це best-effort fallback — не гарантує 100% точності.
*/
export function getAdminUnitByPostCode(postCode) {
  if (!postCode || typeof postCode !== 'string') return null;

  /*
    Нормалізуємо post_code: видаляємо пробіли.
    Якщо post_code — діапазон (наприклад "50000-50479") або нестандартний формат
    ("500036"), відповідність не гарантована — повертаємо null.
  */
  const normalized = postCode.trim();

  // Відхиляємо нестандартні формати: діапазони або коди довші/коротші ніж 5 цифр
  if (!/^\d{5}$/.test(normalized)) return null;

  /*
    Таблиця відповідностей: поштовий префікс -> назва admin unit.
    Порядок важливий: більш специфічні (довші) префікси перевіряємо ПЕРШИМИ.

    Побудовано на основі реальних поштових індексів з export.geojson:
    - 500xx, 501xx, 502xx -> міські райони Кривого Рогу
      (внутрішні межі між районами по post_code не завжди однозначні,
       тому для цього діапазону повертаємо місто Кривий Ріг — загальний fallback)
    - 53860, 53861 -> Зеленодольська міська громада
    - 538xx        -> Апостолівська міська громада
    - 531xx        -> Лозуватська сільська громада
    - 53100        -> Софіївська селищна громада
    - 537xx        -> Широківська/Карпівська громади
  */
  const PREFIX_TO_ADMIN_UNIT = [
    // Більш специфічні — перші
    { prefix: '53860', name: 'Зеленодольська міська громада' },
    { prefix: '53861', name: 'Зеленодольська міська громада' },
    { prefix: '53100', name: 'Софіївська селищна громада' },
    { prefix: '5386',  name: 'Зеленодольська міська громада' },
    // Загальніші — після
    { prefix: '538',   name: 'Апостолівська міська громада' },
    { prefix: '531',   name: 'Лозуватська сільська громада' },
    // 53020 також відноситься до Лозуватської громади (перевірено по export.geojson)
    { prefix: '530',   name: 'Лозуватська сільська громада' },
    { prefix: '537',   name: 'Широківська селищна громада' },
    // Кривий Ріг: 500xx-502xx — загальний рівень міста як fallback
    // (райони міста не розрізняються по post_code однозначно)
    { prefix: '500',   name: 'Кривий Ріг' },
    { prefix: '501',   name: 'Кривий Ріг' },
    { prefix: '502',   name: 'Кривий Ріг' },
  ];

  for (const { prefix, name } of PREFIX_TO_ADMIN_UNIT) {
    if (normalized.startsWith(prefix)) {
      return name;
    }
  }

  // post_code не знайдено в таблиці
  return null;
}
