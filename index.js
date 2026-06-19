import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import errorHandler from './src/middleware/errorHandler.js';
import organizationsRoutes from './src/routes/organizations.js';
import categoriesRoutes from './src/routes/categories.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Базові middleware
app.use(cors());
app.use(express.json()); // Для парсингу application/json
app.use(express.urlencoded({ extended: true })); // Для парсингу application/x-www-form-urlencoded

// Підключення роутів
app.use('/api/organizations', organizationsRoutes);
app.use('/api/categories', categoriesRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Catalog API is running" });
});

// Middleware для обробки помилок
// 404 — роут не знайдено
app.use((req, res, next) => {
    res.status(404).json({
        errors: [{ field: 'url', message: `Route ${req.method} ${req.originalUrl} not found` }]
    });
});

// Глобальний обробник серверних помилок (500)
app.use(errorHandler);


const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
});
