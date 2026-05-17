// Глобальний обробник помилок, який форматує відповідь згідно з документацією
const errorHandler = (err, req, res, next) => {
  console.error(err); //показує stack, показує кастомні поля, краще для Express API debugging

  const statusCode = err.status || 500; //якщо немає статусу
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    //відповідь API
    errors: [
      {
        field: err.field || "server",
        message: message,
      },
    ],
  });
};

module.exports = errorHandler;
