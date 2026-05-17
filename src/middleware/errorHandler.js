// Глобальний обробник помилок, який форматує відповідь згідно з документацією
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        errors: [{
            field: err.field || 'server',
            message: message
        }]
    });
};

module.exports = errorHandler;
