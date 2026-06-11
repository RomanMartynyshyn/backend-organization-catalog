/*
  Цей файл є невеликим додатком для запуску парсера.

  Він:
  1. Викликає функцію parseGeoJson.
  2. Передає їй шлях до GeoJSON-файлу.
  3. Зберігає результат у parsedData.json.
  4. Виводить у консоль кількість записів у кожній "таблиці".
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import parseGeoJson from './geoJsonParser.js';

/*
  В ES Modules немає стандартних змінних __filename та __dirname,
  які зазвичай є в CommonJS.

  Тому ми створюємо їх вручну через import.meta.url.
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
  Шлях до вхідного GeoJSON-файлу.

  Файл export.geojson має лежати в тій самій папці,
  що й цей appParse.js.
*/
const inputFilePath = path.join(__dirname, 'export.geojson');

/*
  Шлях до файлу, у який буде збережений результат парсингу.

  Після запуску додатку з'явиться файл parsedData.json.
*/
const outputFilePath = path.join(__dirname, 'parsedData.json');

const sqlInsertsFilePath = path.join(__dirname, 'inserts.sql');

/*
  Функція зберігає розпарсені дані у JSON-файл.

  JSON.stringify(data, null, 2) використовується для того,
  щоб файл був красиво відформатований і його було зручно читати.
*/
const saveParsedData = (data, filePath) => {
    const jsonData = JSON.stringify(data, null, 2);

    fs.writeFileSync(filePath, jsonData, 'utf-8');
};

/*
  Функція виводить статистику після парсингу.

  Тут ми показуємо кількість записів у кожному масиві,
  який імітує таблицю БД.
*/
const printTableStats = (data) => {
    console.log('Парсинг завершено.');
    console.log('Кількість записів у таблицях:');

    console.log(`CATEGORIES: ${data.CATEGORIES.length}`);
    console.log(`ORGANIZATIONS: ${data.ORGANIZATIONS.length}`);
    console.log(`LOCATIONS: ${data.LOCATIONS.length}`);
    console.log(`ORGANIZATION_CATEGORIES: ${data.ORGANIZATION_CATEGORIES.length}`);
};

function insertCategories(categories) {
    const header = 'INSERT INTO categories (' +
        'id, ' +
        'name' +
        ')\n' +
        ' values\n'

    const values = categories
        .map(category => `    (`+
            `${category.category_id},`+
            `${sqlString(category.name)}`+
            `)`);

    return header + values.join(',\n')
}

function sqlString(stringValue) {
    if (!!stringValue) {
        return `'${stringValue.replace(/'/g, "''")}'`
    }
    return 'NULL'
}

function sqlJson(jsonObject) {
    if (Object.keys(jsonObject).length > 0) {
        return `'${JSON.stringify(jsonObject).replace(/'/g, "''")}'`
    }
    return 'NULL'
}

function insertOrganizations(organizations) {
    const header = 'INSERT INTO organizations (' +
        'id, \n' +
        'name, \n' +
        'description, \n' +
        'website_url, \n' +
        'social_links, \n' +
        'contacts, \n' +
        'working_hours, \n' +
        'status, \n' +
        'approved_at, \n' +
        'created_at, \n' +
        'updated_at\n' +
        ')\n' +
        ' values\n'

    const values = organizations
        .map(organization => `    (`+
            `${organization.org_id}, \n`+
            `${sqlString(organization.name)}, \n`+
            `${sqlString(organization.description)}, \n`+
            `${sqlString(organization.website_url)}, \n`+
            `${sqlJson(organization.social_links)}, \n`+
            `${sqlJson(organization.contacts)}, \n`+
            `${sqlString(organization.working_hours)}, \n`+
            `'approved', \n`+
            `NOW(), \n`+
            `NOW(), \n`+
            `NOW()\n` +
            `)`);

    return header + values.join(',\n')
}

function insertLocations(locations) {
    const header = 'INSERT INTO locations (' +
        'location_id, \n' +
        'organization_id, \n' +
        'street, \n' +
        'city, \n' +
        'region, \n' +
        'post_code, \n' +
        'latitude, \n' +
        'longitude \n' +
        ')\n' +
        ' values\n'

    const values = locations
        .map(location => `    (`+
            `${location.location_id}, \n`+
            `${location.organization_id}, \n`+
            `${sqlString(location.street + ' ' + location.building)}, \n`+
            `${sqlString(location.city)}, \n`+
            `${sqlString(location.region)}, \n`+
            `${sqlString(location.post_code)}, \n`+
            `${location.latitude}, \n`+
            `${location.longitude} \n`+
            `)`);

    return header + values.join(',\n')
}

function insertOrganizationCategories(organizationCategories) {
    const header = 'INSERT INTO organization_categories (' +
        'organization_id, \n' +
        'category_id\n' +
        ')\n' +
        ' values\n'

    const values = organizationCategories
        .map(organizationCategory => `    (`+
            `${organizationCategory.org_id}, \n`+
            `${organizationCategory.category_id}\n`+
            `)`)

    return header + values.join(',\n')
}
/*
  Основна функція додатку.

  У try виконується основна логіка:
  - парсимо GeoJSON;
  - зберігаємо результат;
  - виводимо статистику.

  У catch обробляємо можливі помилки:
  - файл не знайдено;
  - некоректний JSON;
  - помилка всередині парсера.
*/
const main = () => {
    try {
        /*
          Викликаємо парсер і передаємо шлях до GeoJSON-файлу.

          parseGeoJson повертає об'єкт виду:
          {
            CATEGORIES: [],
            ORGANIZATIONS: [],
            LOCATIONS: [],
            ORGANIZATION_CATEGORIES: []
          }
        */
        const parsedData = parseGeoJson(inputFilePath);

        /*
          Зберігаємо результат парсингу у файл parsedData.json.
        */
        saveParsedData(parsedData, outputFilePath);


        /*
          Generate SQL INSERT statements for each table.
         */
        const sqlStatements =
            insertCategories(parsedData.CATEGORIES) + ';\n\n' +
            insertOrganizations(parsedData.ORGANIZATIONS) + ';\n\n' +
            insertLocations(parsedData.LOCATIONS) + ';\n\n' +
            insertOrganizationCategories(parsedData.ORGANIZATION_CATEGORIES) + ';\n\n'
        ;
        fs.writeFileSync(sqlInsertsFilePath, sqlStatements, 'utf-8');
        
        /*
          Виводимо кількість записів у кожній "таблиці".
        */
        printTableStats(parsedData);

        /*
          Додатково показуємо шлях, куди був збережений результат.
        */
        console.log(`Результат збережено у файл: ${outputFilePath}`);
    } catch (error) {
        /*
          Якщо щось пішло не так, програма не впаде мовчки,
          а виведе зрозуміле повідомлення про помилку.
        */
        console.error('Помилка під час парсингу GeoJSON:');
        console.error(error.message);
    }
};

/*
  Запускаємо додаток.
*/
main();