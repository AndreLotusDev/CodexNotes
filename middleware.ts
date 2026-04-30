import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  if (request.method === "POST" && !requestHeaders.get("origin")) {
    requestHeaders.set("origin", request.nextUrl.origin);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
  const scriptSrc =
    process.env.NODE_ENV === "development" ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src ${scriptSrc}; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  );
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
