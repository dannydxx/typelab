import { NextResponse } from "next/server";
import { ADMIN_ACCESS_COOKIE } from "@/lib/server/admin";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
