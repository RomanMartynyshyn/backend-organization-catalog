import fs from 'fs';

/*
  Усі організації у GeoJSON належать до Кривого Рогу,
  тому city не беремо з файлу, а хардкодимо.
*/
const CITY = 'Кривий Ріг';
const REGION = 'Дніпропетровська';

/*
  У GeoJSON категорія організації може бути записана в різних полях.
  Наприклад:
  - amenity: "restaurant"
  - shop: "supermarket"
  - office: "lawyer"
  - tourism: "hotel"
  - healthcare: "pharmacy"

  Ми перевіряємо ці поля в заданому порядку.
*/
const CATEGORY_KEYS = ['amenity', 'shop', 'office', 'tourism', 'healthcare'];

/*
  Це бізнес-категорії, які використовуються вже у нашій БД.
  Сирі категорії з GeoJSON ми будемо приводити саме до цих значень.
*/
const BUSINESS_CATEGORIES = {
    FOOD: 'Заклади харчування',
    GROCERY: 'Продукти та супермаркети',
    MALLS: 'Торгові центри та Універмаги',
    CLOTHES: 'Одяг, взуття та аксесуари',
    ELECTRONICS: 'Електроніка та побутова техніка',
    HOME: 'Будинок, ремонт та будівництво',
    HEALTH: "Медицина та здоров'я",
    BEAUTY: 'Послуги краси',
    BUSINESS: 'Бізнес, фінанси та сервіси',
    TOURISM: 'Туризм та відпочинок'
};

/*
  Маплення сирих категорій з GeoJSON на бізнес-категорії нашої БД.

  Наприклад:
  shop: "supermarket"
  перетвориться на:
  "Продукти та супермаркети"

  Якщо сирої категорії тут немає, організація не отримає категорію.
*/
const RAW_CATEGORY_TO_BUSINESS_CATEGORY = {
    cafe: BUSINESS_CATEGORIES.FOOD,
    restaurant: BUSINESS_CATEGORIES.FOOD,
    fast_food: BUSINESS_CATEGORIES.FOOD,
    bar: BUSINESS_CATEGORIES.FOOD,
    pub: BUSINESS_CATEGORIES.FOOD,

    supermarket: BUSINESS_CATEGORIES.GROCERY,
    convenience: BUSINESS_CATEGORIES.GROCERY,

    mall: BUSINESS_CATEGORIES.MALLS,
    department_store: BUSINESS_CATEGORIES.MALLS,

    clothes: BUSINESS_CATEGORIES.CLOTHES,
    shoes: BUSINESS_CATEGORIES.CLOTHES,
    jewelry: BUSINESS_CATEGORIES.CLOTHES,
    bag: BUSINESS_CATEGORIES.CLOTHES,

    electronics: BUSINESS_CATEGORIES.ELECTRONICS,
    computer: BUSINESS_CATEGORIES.ELECTRONICS,
    mobile_phone: BUSINESS_CATEGORIES.ELECTRONICS,
    appliance: BUSINESS_CATEGORIES.ELECTRONICS,

    doityourself: BUSINESS_CATEGORIES.HOME,
    hardware: BUSINESS_CATEGORIES.HOME,
    furniture: BUSINESS_CATEGORIES.HOME,
    building_materials: BUSINESS_CATEGORIES.HOME,

    pharmacy: BUSINESS_CATEGORIES.HEALTH,
    clinic: BUSINESS_CATEGORIES.HEALTH,
    hospital: BUSINESS_CATEGORIES.HEALTH,
    dentist: BUSINESS_CATEGORIES.HEALTH,
    doctors: BUSINESS_CATEGORIES.HEALTH,

    beauty: BUSINESS_CATEGORIES.BEAUTY,
    hairdresser: BUSINESS_CATEGORIES.BEAUTY,
    cosmetics: BUSINESS_CATEGORIES.BEAUTY,

    bank: BUSINESS_CATEGORIES.BUSINESS,
    atm: BUSINESS_CATEGORIES.BUSINESS,
    company: BUSINESS_CATEGORIES.BUSINESS,
    it: BUSINESS_CATEGORIES.BUSINESS,
    lawyer: BUSINESS_CATEGORIES.BUSINESS,
    insurance: BUSINESS_CATEGORIES.BUSINESS,

    hotel: BUSINESS_CATEGORIES.TOURISM,
    guest_house: BUSINESS_CATEGORIES.TOURISM,
    hostel: BUSINESS_CATEGORIES.TOURISM,
    museum: BUSINESS_CATEGORIES.TOURISM,
    attraction: BUSINESS_CATEGORIES.TOURISM
};

/*
  Нормалізуємо назву організації для порівняння.

  Наприклад:
  "  АТБ-Маркет  "
  "АТБ-Маркет"
  "атб-маркет"

  будуть приведені до одного формату.
  Це потрібно для правильного групування однакових організацій.
*/
const normalizeName = (name) => {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
};

/*
  Нормалізуємо значення сирої категорії.
  Наприклад " Supermarket " -> "supermarket".
*/
const normalizeCategoryValue = (categoryName) => {
    return String(categoryName).trim().toLowerCase();
};

/*
  У деяких GeoJSON-файлах назва може бути не тільки в полі name,
  а ще в name:ua, name:uk або name:en.

  Ми беремо перше доступне значення.
*/
const getOrganizationName = (properties) => {
    return properties.name
        ?? properties['name:ua']
        ?? properties['name:uk']
        ?? properties['name:en']
        ?? null;
};

/*
  Дістаємо всі сирі категорії, які є у конкретного feature.

  Наприклад, якщо у записі є:
  {
    amenity: "public_building",
    office: "lawyer"
  }

  функція поверне:
  ["public_building", "lawyer"]
*/
const getRawCategoryNames = (properties) => {
    return CATEGORY_KEYS
        .map((key) => properties[key])
        .filter((categoryName) => categoryName !== undefined && categoryName !== null);
};

/*
  Перетворюємо сирі категорії з GeoJSON на одну бізнес-категорію.

  Беремо першу категорію, яку можемо замапити.
  Це простий і безпечний варіант, щоб не створювати багато категорій
  для одного запису випадково.
*/
const getBusinessCategoryName = (properties) => {
    const rawCategoryNames = getRawCategoryNames(properties);

    for (const rawCategoryName of rawCategoryNames) {
        const normalizedRawCategoryName = normalizeCategoryValue(rawCategoryName);
        const businessCategoryName = RAW_CATEGORY_TO_BUSINESS_CATEGORY[normalizedRawCategoryName];

        if (businessCategoryName) {
            return businessCategoryName;
        }
    }

    /*
      Якщо жодну сиру категорію не вдалося замапити,
      повертаємо null. У такому випадку організація буде створена,
      але без зв'язку з категорією.
    */
    return null;
};

/*
  Ключ групування організацій.

  Раніше ми групували тільки за name.
  Але це може створити помилку, якщо однакова назва використовується
  для різних типів бізнесу.

  Наприклад:
  "Аврора" + "Туризм та відпочинок"
  і
  "Аврора" + "Торгові центри та Універмаги"

  будуть різними організаціями.
*/
const getOrganizationGroupKey = (organizationName, businessCategoryName) => {
    const normalizedOrganizationName = normalizeName(organizationName);

    const normalizedBusinessCategoryName = businessCategoryName
        ? normalizeName(businessCategoryName)
        : 'without-category';

    return `${normalizedOrganizationName}:${normalizedBusinessCategoryName}`;
};

/*
  Дістаємо сайт організації.
  У GeoJSON сайт може бути записаний у різних полях.
*/
const getWebsiteUrl = (properties) => {
    return properties.website
        ?? properties['contact:website']
        ?? properties.url
        ?? null;
};

/*
  У файлі телефони можуть бути записані одним рядком через ";".

  Наприклад:
  "+380501111111;+380672222222"

  Після обробки отримаємо масив:
  ["+380501111111", "+380672222222"]
*/
const splitPhoneNumbers = (phoneValue) => {
    if (!phoneValue) {
        return [];
    }

    return String(phoneValue)
        .split(';')
        .map((phoneNumber) => phoneNumber.trim())
        .filter((phoneNumber) => phoneNumber.length > 0);
};

/*
  Дістаємо телефони з усіх можливих телефонних полів.
  Навіть якщо номер один, у результаті все одно буде масив.
*/
const getPhoneNumbers = (properties) => {
    const phoneFields = [
        properties.phone,
        properties['contact:phone'],
        properties['phone:UA']
    ];

    const phoneNumbers = phoneFields.flatMap(splitPhoneNumbers);

    /*
      Set використовується для видалення дублікатів.
      Наприклад, якщо один і той самий номер є і в phone, і в contact:phone.
    */
    return [...new Set(phoneNumbers)];
};

/*
  Формуємо об'єкт social_links.

  Важливо:
  якщо facebook, instagram або telegram відсутні,
  ми не записуємо їх як null.

  Тобто буде:
  social_links: {}

  а не:
  social_links: {
    facebook: null,
    instagram: null,
    telegram: null
  }
*/
const getSocialLinks = (properties) => {
    const socialLinks = {};

    const facebook = properties['contact:facebook'] ?? properties.facebook ?? null;
    const instagram = properties['contact:instagram'] ?? properties.instagram ?? null;
    const telegram = properties['contact:telegram'] ?? properties.telegram ?? null;

    if (facebook) {
        socialLinks.facebook = facebook;
    }

    if (instagram) {
        socialLinks.instagram = instagram;
    }

    if (telegram) {
        socialLinks.telegram = telegram;
    }

    return socialLinks;
};

/*
  Формуємо об'єкт contacts.

  Якщо контактів немає, повернеться порожній об'єкт:
  contacts: {}

  Якщо є телефони:
  contacts: {
    phone_numbers: [...]
  }

  Якщо є email:
  contacts: {
    email: "..."
  }
*/
const getContacts = (properties) => {
    const contacts = {};

    const phoneNumbers = getPhoneNumbers(properties);
    const email = properties.email ?? properties['contact:email'] ?? null;

    if (phoneNumbers.length > 0) {
        contacts.phone_numbers = phoneNumbers;
    }

    if (email) {
        contacts.email = email;
    }

    return contacts;
};

/*
  Якщо організація вже існує, але в іншому feature знайдені нові телефони,
  ми об'єднуємо старі й нові номери.
*/
const mergePhoneNumbers = (oldContacts, newContacts) => {
    const oldPhoneNumbers = oldContacts.phone_numbers ?? [];
    const newPhoneNumbers = newContacts.phone_numbers ?? [];

    const mergedPhoneNumbers = [...new Set([
        ...oldPhoneNumbers,
        ...newPhoneNumbers
    ])];

    if (mergedPhoneNumbers.length > 0) {
        oldContacts.phone_numbers = mergedPhoneNumbers;
    }
};

/*
  Якщо одна організація має кілька локацій, у різних записах можуть бути
  різні контакти, сайт, соцмережі або години роботи.

  Ця функція доповнює вже створену організацію новими даними,
  але не перезаписує хороші існуючі значення порожніми.
*/
const mergeOrganizationData = (organization, properties) => {
    const newContacts = getContacts(properties);
    const newSocialLinks = getSocialLinks(properties);
    const newWebsiteUrl = getWebsiteUrl(properties);

    mergePhoneNumbers(organization.contacts, newContacts);

    if (!organization.contacts.email && newContacts.email) {
        organization.contacts.email = newContacts.email;
    }

    /*
      Соцмережі можна безпечно об'єднати.
      Якщо в новому записі є instagram, а в старому був facebook,
      у результаті будуть обидва поля.
    */
    organization.social_links = {
        ...organization.social_links,
        ...newSocialLinks
    };

    /*
      Якщо сайт уже був знайдений раніше, залишаємо його.
      Якщо не був — записуємо новий.
    */
    if (!organization.website_url && newWebsiteUrl) {
        organization.website_url = newWebsiteUrl;
    }

    if (!organization.working_hours && properties.opening_hours) {
        organization.working_hours = properties.opening_hours;
    }

    if (!organization.description && properties.description) {
        organization.description = properties.description;
    }
};

/*
  Основна функція парсера.

  Вона читає GeoJSON-файл і повертає об'єкт, який імітує таблиці БД:
  - CATEGORIES
  - ORGANIZATIONS
  - LOCATIONS
  - ORGANIZATION_CATEGORIES
*/
const parseGeoJson = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const geoJson = JSON.parse(fileContent);

    /*
      Map використовується для швидкого пошуку вже створених організацій.
      Ключем є name + businessCategory.
    */
    const organizationsMap = new Map();

    /*
      Map для категорій потрібен, щоб не створювати одну й ту саму
      категорію багато разів.
    */
    const categoriesMap = new Map();

    /*
      Set для зв'язків потрібен, щоб не дублювати пари:
      org_id + category_id.
    */
    const organizationCategoriesSet = new Set();

    /*
      Ці масиви імітують таблиці нашої БД.
    */
    const organizations = [];
    const categories = [];
    const locations = [];
    const organizationCategories = [];

    /*
      Оскільки ми поки не вставляємо дані в MySQL,
      ID генеруються вручну.
      У реальній БД це може робити AUTO_INCREMENT.
    */
    let organizationId = 1;
    let categoryId = 1;
    let locationId = 1;

    for (const feature of geoJson.features ?? []) {
        const properties = feature.properties ?? {};
        const geometry = feature.geometry ?? {};

        /*
          Спочатку дістаємо назву організації.
          Якщо назви немає — пропускаємо запис, бо без name
          ми не зможемо нормально створити ORGANIZATION.
        */
        const organizationName = getOrganizationName(properties);

        if (!organizationName) {
            continue;
        }

        /*
          Далі визначаємо бізнес-категорію.
          Вона може бути null, якщо сирі дані не вдалося замапити.
        */
        const businessCategoryName = getBusinessCategoryName(properties);

        /*
          Організації групуються за назвою + бізнес-категорією.
          Це зменшує ризик випадково об'єднати різні бізнеси з однаковою назвою.
        */
        const organizationGroupKey = getOrganizationGroupKey(
            organizationName,
            businessCategoryName
        );

        let organization = organizationsMap.get(organizationGroupKey);

        /*
          Якщо такої організації ще не було — створюємо її.
          Якщо вже була — пізніше просто додамо нову локацію
          і, за потреби, доповнимо контакти.
        */
        if (!organization) {
            organization = {
                org_id: organizationId++,
                name: organizationName,
                description: properties.description ?? null,
                status: 'approved',
                social_links: getSocialLinks(properties),
                website_url: getWebsiteUrl(properties),
                contacts: getContacts(properties),
                working_hours: properties.opening_hours ?? null,
                created_at: null,
                updated_at: null,

                /*
                  Поле залишено як у твоїй ER-діаграмі.
                  Якщо в реальній БД воно називається approved_at,
                  тоді краще перейменувати і тут.
                */
                appoved_at: null,

                rejection_reason: null
            };

            organizationsMap.set(organizationGroupKey, organization);
            organizations.push(organization);
        } else {
            /*
              Якщо організація вже існує, то не створюємо дубль.
              Просто доповнюємо її новими даними з поточного feature.
            */
            mergeOrganizationData(organization, properties);
        }

        /*
          Якщо бізнес-категорія визначена, додаємо її в CATEGORIES
          і створюємо зв'язок ORGANIZATION_CATEGORIES.
        */
        if (businessCategoryName !== null) {
            let category = categoriesMap.get(businessCategoryName);

            if (!category) {
                category = {
                    category_id: categoryId++,
                    name: businessCategoryName
                };

                categoriesMap.set(businessCategoryName, category);
                categories.push(category);
            }

            const relationKey = `${organization.org_id}:${category.category_id}`;

            /*
              Один і той самий зв'язок організація-категорія
              не повинен дублюватися.
            */
            if (!organizationCategoriesSet.has(relationKey)) {
                organizationCategoriesSet.add(relationKey);

                organizationCategories.push({
                    org_id: organization.org_id,
                    category_id: category.category_id
                });
            }
        }

        const coordinates = geometry.coordinates ?? [];

        /*
          Важливо:
          у GeoJSON координати мають порядок:
          [longitude, latitude]
    
          Тобто спочатку довгота, потім широта.
        */
        const longitude = coordinates[0] ?? null;
        const latitude = coordinates[1] ?? null;

        /*
          Кожен feature у GeoJSON відповідає одній фізичній локації.
          Навіть якщо організація вже існує, локацію все одно додаємо нову.
        */
        locations.push({
            location_id: locationId++,
            organization_id: organization.org_id,
            street: properties['addr:street'] ?? null,
            building: properties['addr:housenumber'] ?? null,
            city: CITY,
            region: REGION,
            // region: properties['addr:region'] ?? null,
            post_code: properties['addr:postcode'] ?? null,
            latitude,
            longitude
        });
    }

    /*
      Повертаємо структуру, яка за формою схожа на таблиці БД.
      Потім ці масиви можна буде використати для INSERT-запитів.
    */
    return {
        CATEGORIES: categories,
        ORGANIZATIONS: organizations,
        LOCATIONS: locations,
        ORGANIZATION_CATEGORIES: organizationCategories
    };
};

export default parseGeoJson;