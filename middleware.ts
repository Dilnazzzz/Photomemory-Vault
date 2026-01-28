import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookie = req.cookies.get("pmv_sess");
  if (!cookie) {
    const id = (globalThis as any).crypto?.randomUUID?.() ||
      `sess_${Math.random().toString(36).slice(2)}`;
    res.cookies.set("pmv_sess", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  matcher: "/:path*",
};

