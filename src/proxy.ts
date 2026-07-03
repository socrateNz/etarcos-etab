import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthenticated = !!session?.user;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublicRoute = nextUrl.pathname === "/";

  // Allow API routes
  if (isApiRoute) return NextResponse.next();

  // Allow public routes
  if (isPublicRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
