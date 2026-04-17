import { NextResponse, type NextRequest } from "next/server"
import { hasPasswordSessionFromRequest } from "@/lib/password-auth"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"

  if (!isPublic && !hasPasswordSessionFromRequest(request)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({ request: { headers: request.headers } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
