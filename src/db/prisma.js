import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/index.js";

// Створення конфігурації підключення до БД
// ВАЖЛИВО: якщо пароль містить # — в .env файлі береться в лапки: DB_PASSWORD="пароль#тут"
const connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
};

// Опційно: Unix socket для shared хостингу (якщо TCP не дозволений)
if (process.env.DB_SOCKET) {
    connectionConfig.socketPath = process.env.DB_SOCKET;
    delete connectionConfig.host;
    delete connectionConfig.port;
    console.log(`[DB] Using Unix socket: ${process.env.DB_SOCKET}`);
} else {
    console.log(`[DB] Using TCP: ${process.env.DB_HOST}:${connectionConfig.port}`);
}

const adapter = new PrismaMariaDb(connectionConfig);
const prisma = new PrismaClient({ adapter });
export { prisma };
