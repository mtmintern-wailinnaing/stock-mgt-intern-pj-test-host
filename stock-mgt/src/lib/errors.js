export class AppError extends Error {
  constructor(message, statusCode = 400, field = null) {
    super(message);
    this.name = "AppError";
    this.field = field;
    this.statusCode = statusCode;
  }
}
