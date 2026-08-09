import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LOCAL_DEMO_CODE, LOCAL_DEMO_SESSION, PRODUCT_CONFIG, REDEEM_CODE_PATTERN } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createSessionToken } from "@/lib/server/security";

const schema = z.object({ code: z.string().trim().toUpperCase() });

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !REDEEM_CODE_PATTERN.test(parsed.data.code)) {
      return apiError("这个兑换码好像不存在，请检查后重新输入。", 404, "CODE_NOT_FOUND");
    }

    if (process.env.NODE_ENV === "development" && parsed.data.code === LOCAL_DEMO_CODE) {
      const activatedAt = new Date();
      return NextResponse.json({
        ok: true,
        code: LOCAL_DEMO_CODE,
        sessionToken: LOCAL_DEMO_SESSION,
        activatedAt: activatedAt.toISOString(),
        expiresAt: new Date(activatedAt.getTime() + PRODUCT_CONFIG.redeemValidHours * 60 * 60 * 1000).toISOString(),
        canStart: true,
        completedCount: 0,
        maxCompletedCount: PRODUCT_CONFIG.maxCompletedTests,
        latestResult: null,
        demo: true,
      });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("redeem_code", {
      p_code: parsed.data.code,
      p_valid_hours: PRODUCT_CONFIG.redeemValidHours,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return apiError("这个兑换码好像不存在，请检查后重新输入。", 404, "CODE_NOT_FOUND");
    if (result.state === "disabled") return apiError("该兑换码当前无法使用。", 403, "CODE_DISABLED");
    if (result.state === "expired") return apiError("该兑换码已经超过有效期。", 410, "CODE_EXPIRED");

    const { token, digest } = createSessionToken();
    const { error: sessionError } = await supabase.from("redeem_sessions").insert({
      redeem_code_id: result.code_id,
      token_hash: digest,
      expires_at: result.expires_at,
    });
    if (sessionError) throw sessionError;

    const { data: latest } = await supabase
      .from("test_results")
      .select("attempt_id, personality_type, dimension_scores, completed_at")
      .eq("redeem_code_id", result.code_id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      code: parsed.data.code,
      sessionToken: token,
      activatedAt: result.activated_at,
      expiresAt: result.expires_at,
      canStart: Number(result.completed_count) < Number(result.max_completed_count),
      completedCount: result.completed_count,
      maxCompletedCount: result.max_completed_count,
      latestResult: latest ? {
        attemptId: latest.attempt_id,
        personalityId: latest.personality_type,
        scores: latest.dimension_scores,
        completedAt: latest.completed_at,
      } : null,
    });
  } catch (error) {
    return unexpectedError(error);
  }
}
