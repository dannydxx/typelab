import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicServerClient, createServiceClient } from "@/lib/supabase/service";
import { ADMIN_ACCESS_COOKIE } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("请输入正确的管理员邮箱和密码。", 400, "INVALID_LOGIN");
    const publicClient = createPublicServerClient();
    const { data, error } = await publicClient.auth.signInWithPassword(parsed.data);
    if (error || !data.user || !data.session) return apiError("邮箱或密码不正确。", 401, "INVALID_LOGIN");

    const service = createServiceClient();
    const { data: profile } = await service.from("admin_profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (!profile) return apiError("该账户没有管理员权限。", 403, "NOT_ADMIN");

    const response = NextResponse.json({ ok: true, email: data.user.email });
    response.cookies.set(ADMIN_ACCESS_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(60, data.session.expires_in),
    });
    return response;
  } catch (error) {
    return unexpectedError(error);
  }
}
