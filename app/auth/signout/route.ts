import { NextResponse } from "next/server"
import { clearPasswordSessionCookie } from "@/lib/password-auth"

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  clearPasswordSessionCookie(response)
  return response
}
