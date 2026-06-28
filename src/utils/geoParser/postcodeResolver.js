import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
Шлях до файлу з поштовими індексами.
    Структура кожного запису:
{
    "properties": {
    "postcode": "50480",
        "settlementName": "с-ще Гірницьке"
},
    "geometry": null
}
*/
const postcodeMapPath = path.join(__dirname, 'postcode_map_full.geojson');

let postcodeToOtgMap = new Map();
let uniqueOtgs = new Set();

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

        postcodeToOtgMap.set(postcode, settlementName);
        uniqueOtgs.add(settlementName);
    }
}

initPostcodeData();

export function getOtgByPostcode(postcode) {
    if (postcodeToOtgMap.size === 0) {
        initPostcodeData();
    }

    if (!postcode) return null;

    const normalizedPostcode = String(postcode).trim();
    return postcodeToOtgMap.get(normalizedPostcode) ?? null;
}

// /*
//   Повертає масив унікальних settlementName всіх населених пунктів
//   за межами міста Кривий Ріг.
//   Використовується в geoJsonParser.js для динамічного формування ADMIN_UNITS.
// */
//  function getUniqueOtgs() {
//     if (uniqueOtgs.size === 0) {
//         initPostcodeData();
//     }
//     return Array.from(uniqueOtgs);
// }