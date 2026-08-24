import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";

function sessionRole(request: NextRequest) {
  const value = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!value) return null;
  if (value === "admin" || value === "user") return value;
  if (value === "authenticated") return "admin";
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = sessionRole(request);
  const authenticated = Boolean(role);
  const isLoginRoute = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (!authenticated && !isLoginRoute) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && isLoginRoute) {
    return NextResponse.redirect(new URL("/knowledge", request.url));
  }

  if (authenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/knowledge", request.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/knowledge", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
