import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

// const seedFilePath = path.join(__dirname, "sample-data.sql");
const seedFilePath = path.join(__dirname, "../utils/geoParser/inserts.sql");
const resetSql = `
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE organization_categories;
TRUNCATE TABLE categories;
TRUNCATE TABLE organizations;
TRUNCATE TABLE locations;
SET FOREIGN_KEY_CHECKS = 1;
`;

async function seedDatabase() {
    const sql = await readFile(seedFilePath, "utf-8");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    try {
        await connection.query(resetSql);
        await connection.query(sql);
        console.log(`Seed completed successfully using ${seedFilePath}`);
    } finally {
        await connection.end();
    }
}

seedDatabase().catch((error) => {
    console.error("Failed to seed database.");
    console.error(error);
    process.exit(1);
});