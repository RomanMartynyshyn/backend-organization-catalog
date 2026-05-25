import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/index.js";

// Створення Prisma adapter для роботи з базою даних MySQL
const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
};

// На shared хостингу MySQL дозволяє тільки Unix socket (не TCP 127.0.0.1)
// Задай DB_SOCKET=/tmp/mysql.sock у .env на сервері
if (process.env.DB_SOCKET) {
    connectionConfig.socketPath = process.env.DB_SOCKET;
    delete connectionConfig.host;
    console.log(`[DB] Using Unix socket: ${process.env.DB_SOCKET}`);
} else {
    console.log(`[DB] Using TCP host: ${process.env.DB_HOST}`);
}

const adapter = new PrismaMariaDb(connectionConfig);
const prisma = new PrismaClient({ adapter });
export { prisma };
