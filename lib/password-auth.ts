import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"

export const PASSWORD_COOKIE_NAME = "kairos_password_session"

export function getAppPassword(): string {
  return process.env.KAIROS_APP_PASSWORD ?? ""
}

export function isPasswordValid(input: string): boolean {
  const expected = getAppPassword()
  return expected.length > 0 && input === expected
}

export function hasPasswordSessionFromRequest(request: NextRequest): boolean {
  const value = request.cookies.get(PASSWORD_COOKIE_NAME)?.value
  return Boolean(value) && value === getAppPassword()
}

export function hasPasswordSession(): boolean {
  const value = cookies().get(PASSWORD_COOKIE_NAME)?.value
  return Boolean(value) && value === getAppPassword()
}

export function setPasswordSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: PASSWORD_COOKIE_NAME,
    value: getAppPassword(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearPasswordSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: PASSWORD_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
