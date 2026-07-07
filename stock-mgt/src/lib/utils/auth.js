import jwt from "jsonwebtoken";
import { AppError } from "../errors";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function authorizeRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/login") {
    return null;
  }

  let token = request.cookies.get("auth-token")?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    throw new AppError(
      "Missing or malformed Authorization header/cookie",
      401,
      "token_missing",
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new AppError("Invalid or expired token", 401, "token_invalid");
  }
}
