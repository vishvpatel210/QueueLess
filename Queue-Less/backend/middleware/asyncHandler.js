/**
 * Wraps an async Express route handler and forwards errors to next()
 * so that the central error handler can process them.
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped Express route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
