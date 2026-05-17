require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Базові middleware
app.use(cors());
app.use(express.json()); // Для парсингу application/json
app.use(express.urlencoded({ extended: true })); // Для парсингу application/x-www-form-urlencoded

// Підключення роутів
app.use('/api/organizations', require('./src/routes/organizations'));
app.use('/api/categories', require('./src/routes/categories'));

app.get('/', (req, res) => {
    res.json({ message: "Catalog API is running" });
});

// Middleware для обробки помилок
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
