import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_ROUTES = ["/", "/auth/login", "/api/auth", "/api/auth/", "/favicon.ico", "/_next/", "/_static/"]

function isPublicPath(pathname: string) {
  for (const p of PUBLIC_ROUTES) {
    if (pathname === p) return true
    if (p.endsWith("/") && pathname.startsWith(p)) return true
    if (pathname.startsWith("/api/auth")) return true
  }
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // allow public assets and next internals
  if (isPublicPath(pathname) || pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // If no token -> redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("from", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role as string | undefined
  // Admin can access everything
  if (role === "ADMIN") {
    return NextResponse.next()
  }

  // Manager pages: /manager
  if (pathname.startsWith("/manager")) {
    if (role === "MANAGER") return NextResponse.next()
    // else redirect unauthorized
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Staff pages: /staff
  if (pathname.startsWith("/staff")) {
    if (role === "STAFF") return NextResponse.next()
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Admin area (if you have /admin)
  if (pathname.startsWith("/admin")) {
    if (role === "ADMIN") return NextResponse.next()
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Default allow other pages
  return NextResponse.next()
}

export const config = {
  matcher: ["/manager/:path*", "/staff/:path*", "/admin/:path*", "/((?!_next|_static|favicon.ico).*)"],
}