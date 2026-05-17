const fs = require('fs');
const csv = require('csv-parser');

// Утиліта для парсингу CSV файлу 
// формат: .CSV, кодування UTF-8, макс розмір: 8MB
const parseCSV = (filePath) => {
    // TODO: Логіка парсингу та валідації рядків (дублікати, порожні рядки)
};

module.exports = { parseCSV };
