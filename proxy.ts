import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AUTH_RATE_LIMIT_MESSAGE,
  buildRateLimitHeaders,
  checkAuthRateLimit,
} from "@/features/auth/rate-limit";

function isAuthApiPath(pathname: string) {
  return pathname.startsWith("/api/auth/");
}

export async function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const rateLimitResult = await checkAuthRateLimit({
    headers: request.headers,
    pathname: request.nextUrl.pathname,
  });

  if (!rateLimitResult || rateLimitResult.success) {
    return NextResponse.next();
  }

  const headers = buildRateLimitHeaders(rateLimitResult);

  if (isAuthApiPath(request.nextUrl.pathname)) {
    return NextResponse.json(
      {
        error: AUTH_RATE_LIMIT_MESSAGE,
      },
      {
        status: 429,
        headers,
      },
    );
  }

  return new NextResponse(AUTH_RATE_LIMIT_MESSAGE, {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

export const config = {
  matcher: ["/api/auth/:path*", "/sign-in"],
};
