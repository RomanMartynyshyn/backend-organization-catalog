// Обгортка для асинхронних функцій, щоб не використовувати try-catch у кожному контролері
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
