import { NextResponse } from "next/server";
import { trackPageVisit } from "./lib/analytics";

const protectedPaths = ["/ugc-engine", "/hook-gen", "/clipping", "/profile", "/affiliate", "/admin"];
const publicPaths = ["/login", "/signup", "/forgot-password", "/landing"];

export function middleware(request, event) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("next-auth.session-token")?.value;

  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isApi = pathname.startsWith("/api/");
  const isStatic = pathname.startsWith("/_next/") || pathname.startsWith("/favicon");

  if (isApi || isStatic) return NextResponse.next();

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && sessionToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (event?.waitUntil) {
    event.waitUntil(trackPageVisit(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
