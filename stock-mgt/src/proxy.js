import { NextResponse } from "next/server";
import { getSessionCookies } from "./lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/" || pathname === "/login";

  const session = await getSessionCookies();
  const hasValidSession = session !== null;

  if (!isLoginPage && !hasValidSession) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");
    return response;
  }

  if (isLoginPage && hasValidSession) {
    return NextResponse.redirect(new URL("/stock/current", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
