function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

module.exports = { asyncHandler, sendError };
