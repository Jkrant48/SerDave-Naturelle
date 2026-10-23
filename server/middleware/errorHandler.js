// Error middleware: convert unexpected failures into consistent API responses.
function isDatabaseConnectionError(error) {
  for (let current = error; current; current = current.cause) {
    if (
      current.code === "57P01" ||
      (typeof current.code === "string" && current.code.startsWith("08")) ||
      /connection terminated|connection timeout/i.test(current.message || "")
    ) {
      return true;
    }
  }
  return false;
}

export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  if (error.publicMessage) {
    const status =
      Number.isInteger(error.status) && error.status >= 400 && error.status < 600
        ? error.status
        : 502;
    return res.status(status).json({ message: error.publicMessage });
  }

  if (isDatabaseConnectionError(error)) {
    return res.status(503).json({
      message:
        "The database connection is temporarily unavailable. Please wait a moment and try again.",
    });
  }

  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  const message =
    status < 500 ? error.message : "An unexpected server error occurred.";
  res.status(status).json({ message });
}
