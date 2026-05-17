const { validationResult } = require('express-validator');

// Універсальний middleware для перевірки результатів express-validator
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Форматуємо помилки відповідно до документації
        const formattedErrors = errors.array().map(err => ({
            field: err.path, // express-validator v7 використовує 'path' замість 'param'
            message: err.msg
        }));
        
        return res.status(400).json({ errors: formattedErrors });
    }
    next();
};

module.exports = validate;
