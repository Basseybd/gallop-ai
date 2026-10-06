import { NextResponse, type NextRequest } from "next/server";
import { ASK_HOSTS } from "@/lib/ask";

// Only /ask runs through here. next.config.ts sets the static CSP on every path, and this one replaces it.
// Keys are typed on that page, so it gets a per-request nonce CSP
// (no inline script without the nonce) and may only open connections to Gallop, OpenRouter and the four providers.
export function proxy(request: NextRequest) {
  // The matcher is case-insensitive. Anything but the exact page keeps the static policy from next.config.ts.
  if (request.nextUrl.pathname !== "/ask") return NextResponse.next();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes (the meter width) and next/font need this. Styles can't run code.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${ASK_HOSTS.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  // No other window keeps a handle on this tab, so nothing can steer it during the OpenRouter hop.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return response;
}

export const config = {
  matcher: [
    "/ask",
  ],
};
