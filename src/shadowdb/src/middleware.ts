import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });

  if (!token) {
    // Redirect to login page with callback URL
    const loginUrl = new URL("/Users/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log("User is authenticated", token);

  return NextResponse.next();
}

export const config = {
  matcher: ["/Home/:path*", "/admin/:path*", "/api/protected/:path*"],
};
