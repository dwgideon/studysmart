// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Get the Supabase session from cookies
  const accessToken = req.cookies.get("sb-access-token");

  const { pathname } = req.nextUrl;

  // Allow requests to public paths
  if (
    pathname === "/" || // login/signup page
    pathname.startsWith("/_next") || // next.js internals
    pathname.startsWith("/api") || // API routes
    pathname.startsWith("/static") ||
    pathname.includes(".") // files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected page
  if (!accessToken) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Limit middleware to specific routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
