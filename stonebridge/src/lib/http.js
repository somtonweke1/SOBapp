/** Express wrapper that forwards async exceptions to the error middleware. */
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/** JSON error payload for API routes. */
function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

module.exports = { asyncHandler, sendError };
