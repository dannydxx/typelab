import { NextRequest, NextResponse } from "next/server";
import { apiError, unexpectedError } from "@/lib/server/http";
import { getRedeemSession } from "@/lib/server/redeem-session";
import { createServiceClient } from "@/lib/supabase/service";
import { LOCAL_DEMO_SESSION } from "@/lib/config";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get("x-redeem-session");
    if (process.env.NODE_ENV === "development" && sessionToken === LOCAL_DEMO_SESSION) {
      return NextResponse.json({ ok: true, attemptId: randomUUID(), demo: true });
    }
    const session = await getRedeemSession(sessionToken);
    if (!session) return apiError("兑换会话已失效，请重新输入兑换码。", 401, "SESSION_EXPIRED");

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("start_test_attempt", { p_code_id: session.redeem_code_id });
    if (error) {
      if (error.message.includes("LIMIT_REACHED")) return apiError("该兑换码的测试次数已经使用完毕。", 403, "LIMIT_REACHED");
      if (error.message.includes("CODE_EXPIRED")) return apiError("该兑换码已经超过有效期。", 410, "CODE_EXPIRED");
      throw error;
    }
    return NextResponse.json({ ok: true, attemptId: data });
  } catch (error) {
    return unexpectedError(error);
  }
}
