// Error middleware: convert unexpected failures into consistent API responses.
export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
}
