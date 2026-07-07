import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getSessionCookies() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth-token");

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    const payload = jwt.verify(sessionCookie.value, secret);

    return payload;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
}
