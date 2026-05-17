// Middleware для обробки неіснуючих маршрутів (404)
const notFoundHandler = (req, res, next) => {
  const error = new Error("Route not found");
  //кастомний статус і поле
  error.status = 404;
  error.field = "route";

  next(error); //передача в errorHandler
};

module.exports = notFoundHandler;
