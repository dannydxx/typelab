import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code) return apiError("请输入要查询的兑换码。", 400, "CODE_REQUIRED");
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("redeem_codes").select("*").eq("code", code).maybeSingle();
    if (error) throw error;
    if (!data) return apiError("没有找到这个兑换码。", 404, "CODE_NOT_FOUND");
    return NextResponse.json({ ok: true, code: data });
  } catch (error) {
    return unexpectedError(error);
  }
}

const patchSchema = z.object({
  code: z.string().trim().toUpperCase(),
  action: z.enum(["disable", "enable", "extend"]),
  hours: z.number().int().min(1).max(720).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("操作参数不正确。", 400, "INVALID_ACTION");
    const supabase = createServiceClient();
    const { data: current } = await supabase.from("redeem_codes").select("status, activated_at, expires_at").eq("code", parsed.data.code).maybeSingle();
    if (!current) return apiError("没有找到这个兑换码。", 404, "CODE_NOT_FOUND");

    let updates: Record<string, string>;
    if (parsed.data.action === "disable") updates = { status: "disabled" };
    else if (parsed.data.action === "enable") updates = { status: current.activated_at ? "active" : "unused" };
    else {
      const base = current.expires_at && new Date(current.expires_at) > new Date() ? new Date(current.expires_at) : new Date();
      base.setHours(base.getHours() + (parsed.data.hours ?? 24));
      updates = { status: "active", expires_at: base.toISOString() };
    }
    const { error } = await supabase.from("redeem_codes").update(updates).eq("code", parsed.data.code);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return unexpectedError(error);
  }
}
