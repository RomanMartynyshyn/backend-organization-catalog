# Каталог організацій — Backend API

Backend для каталогу організацій. Проєкт надає REST API для перегляду організацій, категорій і районів, створення заявок на нові організації та зміни статусу організацій.

## Архітектура

Детальний опис структури проєкту винесено в [Architecture.MD](Architecture.MD).

## Технічний стек

- Runtime: Node.js
- Framework: Express.js
- База даних: MySQL
- ORM: Prisma
- Валідація: express-validator

## Локальний запуск

1. Встановіть залежності:

```shell
npm install
```

2. Створіть `.env` у корені проєкту. Prisma використовує `DATABASE_URL`, а сервер також може читати `PORT` і `HOST`.

```shell
DATABASE_URL="mysql://admin:apppassword@localhost:3306/community_catalog"
PORT=3000
HOST=0.0.0.0
```

3. Запустіть MySQL:

```shell
docker compose up -d mysql
```

4. Застосуйте міграції та згенеруйте Prisma Client:

```shell
npm run prisma:migrate
npm run prisma:generate
```

5. За потреби наповніть базу тестовими даними з `src/db/sample-data.sql`:

```shell
npm run db:seed
```

6. Запустіть сервер:

```shell
npm start
```

За замовчуванням API доступне на `http://localhost:3000`.

## Доступні маршрути

### Health Check

#### `GET /`

Повертає службову відповідь:

```json
{
  "message": "Catalog API is running"
}
```

### Організації

#### `GET /api/organizations`

Повертає список організацій. Якщо `status` не передано, повертаються лише організації зі статусом `approved`. Результати сортуються за `createdAt desc`, потім за `id asc`.

Query-параметри:

| Параметр | Тип | Опис |
| --- | --- | --- |
| `status` | string | Один зі статусів: `pending`, `approved`, `rejected`, `archived`. |
| `categoryId` | integer | Фільтр за ID категорії. |
| `districtId` | integer або array | Фільтр за ID району. Можна передати кілька разів: `?districtId=1&districtId=2`. |
| `lat` | float | Широта центру пошуку. Має передаватися разом із `lng` та `radiusKm`. |
| `lng` | float | Довгота центру пошуку. Має передаватися разом із `lat` та `radiusKm`. |
| `radiusKm` | float | Радіус пошуку у кілометрах. Має передаватися разом із `lat` та `lng`. |
| `limit` | integer | Кількість елементів у відповіді. Максимум 15, за замовчуванням 15. |
| `offset` | integer | Зміщення для пагінації. За замовчуванням 0. |
| `search` | string | Пошук за `name` або `description`. |

Приклад:

```shell
curl "http://localhost:3000/api/organizations?categoryId=1&districtId=2&limit=10&offset=0"
```

#### `GET /api/organizations/:id`

Повертає одну організацію за ID.

#### `POST /api/organizations`

Створює нову організацію зі статусом `pending`.

JSON body:

```json
{
  "name": "Назва організації",
  "description": "Короткий опис",
  "websiteUrl": "https://example.org",
  "contacts": {
    "email": "info@example.org",
    "phoneNumbers": ["+380501234567"]
  },
  "socialLinks": {
    "facebook": "https://facebook.com/example",
    "instagram": "https://instagram.com/example"
  },
  "workingHours": "Пн-Пт 09:00-18:00",
  "categoryIds": [1, 2],
  "locations": [
    {
      "street": "Центральна, 1",
      "city": "Кривий Ріг",
      "region": "Дніпропетровська область",
      "postCode": "50000",
      "latitude": 47.9105,
      "longitude": 33.3918,
      "districtId": 1
    }
  ]
}
```

Основні правила валідації:

- `name` обов'язкове, від 2 до 255 символів.
- `websiteUrl` має бути HTTPS URL.
- `categoryIds` обов'язковий масив від 1 до 5 ID.
- `locations` має бути масивом щонайменше з одним елементом.
- Для кожної локації обов'язкові `city`, `region`, `latitude`, `longitude`.
- `postCode`, якщо передано, має містити 5 символів.
- `districtId`, якщо передано, має бути додатним цілим числом.

Успішна відповідь: `201 Created`.

#### `PUT /api/organizations/:id/status`

Змінює статус організації.

JSON body:

```json
{
  "status": "approved",
  "rejectionReason": null
}
```

Дозволені значення `status` для цього маршруту: `approved`, `rejected`, `archived`. Поле `rejectionReason` опційне.

### Категорії

#### `GET /api/categories`

Повертає всі категорії, відсортовані за назвою.

### Райони

#### `GET /api/districts`

Повертає всі райони, відсортовані за назвою.

## Формат відповіді організації

Організації повертаються з категоріями та локаціями. У DTO локації мають поле `district` з назвою району або `null`.

```json
{
  "id": 1,
  "name": "Назва організації",
  "description": "Опис",
  "websiteUrl": "https://example.org",
  "contacts": null,
  "socialLinks": null,
  "workingHours": null,
  "status": "approved",
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:00:00.000Z",
  "approvedAt": null,
  "rejectionReason": null,
  "categories": [
    { "id": 1, "name": "Освіта" }
  ],
  "locations": [
    {
      "id": 1,
      "street": "Центральна, 1",
      "city": "Кривий Ріг",
      "region": "Дніпропетровська область",
      "postCode": "50000",
      "latitude": "47.9105000",
      "longitude": "33.3918000",
      "district": "Саксаганський район"
    }
  ]
}
```

## Помилки

Помилки валідації, 404 та серверні помилки повертаються у форматі:

```json
{
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

Типові статуси:

- `400 Bad Request` — помилка валідації або некоректний запит.
- `404 Not Found` — ресурс або маршрут не знайдено.
- `500 Internal Server Error` — внутрішня помилка сервера.

## Корисні команди

```shell
npm run build
npm run validate:ci
npm run prisma:studio
docker compose ps
docker compose down
```
